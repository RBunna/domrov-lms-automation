import { Injectable, OnModuleInit, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { catchError, lastValueFrom, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

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

// Service Interfaces
interface SubmissionService {
    processSubmission(request: { submission_id: string; file_path: string }): Observable<any>;
    GetSubmissionFolderStructure(request: { submission_id: string}): Observable<any>;

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
        
        @InjectRepository(Submission)
        private submissionRepo: Repository<Submission>,
        
        @InjectRepository(Evaluation)
        private evaluationRepo: Repository<Evaluation>,
        private walletService: WalletService
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
                this.submissionService.GetSubmissionFolderStructure({ submission_id:submissionId }),
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
                            throw new microservices.RpcException({
                                message: err.details || 'Queue service error',
                                code: err.code,
                            });
                        }),
                    ),
            );
            if (!res.success) {
                throw new Error(res.message);
            }
            return res;
        } catch (err) {
            throw err;
        }
    }

    async aiEvaluate(
        submission_id: number,
        feedback: string,
        scores: number[],
        input_token: number,
        output_token: number,
    ): Promise<AIEvaluationResponseDto> {
        // 1. Fetch submission to ensure it exists
        const submission = await this.submissionRepo.findOne({
            where: { id: Number(submission_id) },
            relations: [
                'assessment',
                'assessment.class',
                'assessment.class.owner', // <--- this joins the teacher/owner
            ],
        });

        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        // 2. Create evaluation entity
        let totalScore = 0;

        if (scores.length > 0) {
            totalScore = scores.reduce((sum, current) => sum + current, 0);
        }

        // 2. Create evaluation entity with the calculated total
        const evaluation = this.evaluationRepo.create({
            score: totalScore,
            aiOutput: feedback,
            evaluationType: EvaluationType.AI,
            submission,
        });
        
        if (submission.assessment.aiModelSelectionMode === AIModelSelectionMode.SYSTEM) {
            const cost = calculateCost({ inputTokens: input_token, outputTokens: output_token }, { inputRate: GrokBaseRates.input, outputRate: GrokBaseRates.output })
            await this.walletService.deductCredits(
                submission.assessment.class.owner.id,
                cost,

                TransactionReason.AI_USAGE,
                `Evaluate submission ${submission.id}`
            );
        }

        await this.evaluationRepo.save(evaluation);

        submission.status = SubmissionStatus.GRADED;
        await this.submissionRepo.save(submission);

        return {
            message: 'Evaluation created successfully',
            evaluationId: evaluation.id,
        };
    }
}