import { Injectable, OnModuleInit, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { catchError, lastValueFrom, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities
import { Submission } from '../../../libs/entities/assessment/submission.entity';
import { Evaluation } from '../../../libs/entities/assessment/evaluation.entity';
// import { EvaluationRubricScore } from '../../../libs/entities/assessment/evaluation-rubric-score.entity';

// DTOs & Enums
import { EvaluationDto } from '../../../libs/dtos/assessment/ai-evaluation.dto';
import { SubmissionStatus } from '../../../libs/enums/Status';
import { TasksResponse } from '../../../libs/interfaces/evaluation';
import { EvaluationType } from '../../../libs/enums/Assessment';

// Service Interfaces
interface SubmissionService {
    processSubmission(request: { submission_id: string; file_path: string }): Observable<any>;
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
    ) { }

    onModuleInit() {
        this.submissionService =
            this.client.getService<SubmissionService>('SubmissionService');

        this.tasksQueueService =
            this.client.getService<TasksQueueService>('TasksQueue');
    }

    async processSubmission(submission_id: string, file_path: string) {
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

    async addTaskToQueue(submission_id: string) {
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
        submissionId: number,
        dto: EvaluationDto,
    ) {
        // 1. Fetch submission to ensure it exists
        const submission = await this.submissionRepo.findOne({
            where: { id: submissionId },
        });

        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        // 2. Create evaluation entity
        let totalScore = 0;

        if (dto.rubricScores && dto.rubricScores.length > 0) {
            totalScore = dto.rubricScores.reduce((sum, current) => sum + current.score, 0);
        }

        // 2. Create evaluation entity with the calculated total
        const evaluation = this.evaluationRepo.create({
            score: totalScore,
            feedback: dto.feedback,
            evaluationType: EvaluationType.AI,
            submission,
        });

        await this.evaluationRepo.save(evaluation);

        submission.status = SubmissionStatus.GRADED;
        await this.submissionRepo.save(submission);

        return {
            message: 'Evaluation created successfully',
            evaluationId: evaluation.id,
        };
    }
}