import { Injectable, OnModuleInit, Inject, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { catchError, lastValueFrom, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Entities
import { Submission } from '../../libs/entities/assessment/submission.entity';
import { Evaluation } from '../../libs/entities/assessment/evaluation.entity';
// import { EvaluationRubricScore } from '../../../libs/entities/assessment/evaluation-rubric-score.entity';

// DTOs & Enums
import { SubmissionStatus } from '../../libs/enums/Status';
import { TasksResponse } from '../../libs/interfaces/evaluation';
import { AIModelSelectionMode, EvaluationType } from '../../libs/enums/Assessment';
import { WalletService } from '../wallet/wallet.service';
import { calculateCost } from '../../libs/utils/costCalculator';
import { GrokBaseRates } from '../../libs/const/token-cost';
import { TransactionReason } from '../../libs/entities/ai/wallet-transaction.entity';
import {
    ProcessSubmissionResponseDto,
    FolderStructureResponseDto,
    AddQueueResponseDto,
    AIEvaluationResponseDto,
} from '../../libs/dtos/evaluation/evaluation-response.dto';
import { AIUsageLogService } from '../user-ai/ai-usage-log.service';

// Service Interfaces
interface SubmissionService {
    processSubmission(request: { submission_id: string; file_path: string }): Observable<any>;
    GetSubmissionFolderStructure(request: { submission_id: string }): Observable<any>;

}

interface TasksQueueService {
    AddQueue(request: {
        submission_id: string;
    }): Observable<{ success: boolean; message: string }>;
}

@Injectable()
export class EvaluationService implements OnModuleInit {
    private submissionService: SubmissionService;
    private tasksQueueService: TasksQueueService;

    constructor(
        @Inject('CODE_EVAL_GRPC')
        private readonly client: microservices.ClientGrpc,
        private walletService: WalletService,
        private readonly aiLogService: AIUsageLogService,
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    onModuleInit() {
        this.submissionService =
            this.client.getService<SubmissionService>('SubmissionService');

        this.tasksQueueService =
            this.client.getService<TasksQueueService>('TasksQueue');
    }

    async processSubmission(submission_id: string, file_path: string): Promise<ProcessSubmissionResponseDto> {
        try {
            // Convert Observable to Promise
            const result = await lastValueFrom(
                this.submissionService.processSubmission({ submission_id, file_path }),
            );
            return result;
        } catch (err: unknown) {
            const grpcError = err as { code?: number; message?: string };
            console.error('gRPC error:', grpcError.message);

            if (grpcError.code === 5) {
                throw new NotFoundException(`File not found or empty: ${file_path}`);
            }

            throw err;
        }
    }

    async getSubmissionFolderStructure(submissionId: string): Promise<FolderStructureResponseDto> {
        try {
            // 1. Convert Observable to Promise to match processSubmission style
            const result = await lastValueFrom(
                this.submissionService.GetSubmissionFolderStructure({ submission_id: submissionId }),
            );

            // 2. Return consistent success structure
            return {
                success: true,
                message: 'Folder structure fetched',
                folder_structure: result.folder_structure
                    ? JSON.parse(result.folder_structure)
                    : {},
            };
        } catch (err: unknown) {
            const grpcError = err as { code?: number; message?: string };
            console.error('gRPC error (Folder Structure):', grpcError.message);

            // 3. Handle gRPC code 5 (NOT_FOUND)
            if (grpcError.code === 5) {
                throw new NotFoundException(`Submission structure not found for ID: ${submissionId}`);
            }

            // 4. Re-throw unhandled errors (will likely result in 500 Internal Server Error)
            throw err;
        }
    }

    async addTaskToQueue(submission_id: string): Promise<AddQueueResponseDto> {
        try {
            const res = await lastValueFrom<TasksResponse>(
                this.tasksQueueService
                    .AddQueue({ submission_id })
                    .pipe(
                        catchError(err => {
                            throw new BadRequestException(err.details || 'Queue service error');
                        }),
                    ),
            );
            if (!res.success) {
                throw new BadRequestException(res.message);
            }
            return res;
        } catch (err) {
            if (err instanceof BadRequestException) throw err;
            const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
            throw new InternalServerErrorException('Queue error: ' + errorMsg);
        }
    }

    async aiEvaluate(
        submission_id: number,
        feedback: string,
        scores: number[],
        input_token: number,
        output_token: number,
        ai_model: string, // Added ai_model parameter
    ): Promise<AIEvaluationResponseDto> {
        // 1. Validate scores
        if (!Array.isArray(scores) || scores.length === 0 || scores.some(s => typeof s !== 'number' || s < 0)) {
            throw new BadRequestException(`[Submission: ${submission_id}] [Model: ${ai_model}] Invalid scores array`);
        }

        try {
            // Transaction for atomicity
            return await this.dataSource.transaction(async manager => {
                // 2. Fetch submission to ensure it exists
                const submission = await manager.findOne(Submission, {
                    where: { id: Number(submission_id) },
                    relations: [
                        'assessment',
                        'assessment.class',
                        'assessment.class.owner',
                    ],
                });

                if (!submission) {
                    throw new NotFoundException(`[Submission: ${submission_id}] [Model: ${ai_model}] Submission not found`);
                }

                // 3. Check for existing evaluation
                const existingEval = await manager.findOne(Evaluation, {
                    where: { submission: { id: submission.id } },
                });
                if (existingEval) {
                    throw new ConflictException(`[Submission: ${submission_id}] [Model: ${ai_model}] Submission already has an evaluation`);
                }

                // 4. Create evaluation entity
                const totalScore = scores.reduce((sum, current) => sum + current, 0);
                const evaluation = manager.create(Evaluation, {
                    score: totalScore,
                    aiOutput: feedback,
                    evaluationType: EvaluationType.AI,
                    submission,
                });

                // 5. Handle Credit Deduction (System Mode)
                if (submission.assessment.aiModelSelectionMode === AIModelSelectionMode.SYSTEM) {
                    const cost = calculateCost(
                        { inputTokens: input_token, outputTokens: output_token },
                        { inputRate: GrokBaseRates.input, outputRate: GrokBaseRates.output }
                    );

                    try {
                        await this.walletService.deductCredits(
                            submission.assessment.class.owner.id,
                            cost,
                            TransactionReason.AI_USAGE,
                            `Evaluate submission ${submission.id} using ${ai_model}`
                        );                
                    } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : String(err);
                        throw new BadRequestException(`[Submission: ${submission_id}] [Model: ${ai_model}] Wallet deduction failed: ${errorMsg}`);
                    }
                }

                // 6. Save and Update Status
                await manager.save(Evaluation, evaluation);
                submission.status = SubmissionStatus.GRADED;
                await manager.save(Submission, submission);
                await this.aiLogService.createLog(
                    {
                        title: `AI Evaluation - Submission ${submission.id} in assessment ${submission.assessment.title}`,
                        inputTokenCount: input_token,
                        outputTokenCount: output_token,
                        userId: submission.assessment.class.owner.id,
                    }
                )
                return {
                    message: 'Evaluation created successfully',
                    evaluationId: evaluation.id,
                };
            });
        } catch (error) {
            // Re-wrap generic errors to include the required context
            if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }

            // Log the unexpected error internally
            console.error(`Unexpected AI Evaluation Error - SubID: ${submission_id}, Model: ${ai_model}`, error);

            // Extract error message safely
            let errorMsg: string;
            if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
                errorMsg = (error as any).message;
            } else {
                errorMsg = String(error);
            }

            // Throw standardized error with the required context
            throw new InternalServerErrorException(
                `[Submission: ${submission_id}] [Model: ${ai_model}] Internal Error: ${errorMsg}`
            );
        }
    }
}