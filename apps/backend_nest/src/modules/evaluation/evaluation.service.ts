import { Injectable, OnModuleInit, Inject, NotFoundException } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { catchError, lastValueFrom, Observable } from 'rxjs';
import { TasksResponse } from '../../../libs/interfaces/evaluation';

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
    private tasksQueueService: TasksQueueService

    constructor(
        @Inject('CODE_EVAL_GRPC')
        private readonly client: microservices.ClientGrpc,
    ) { }


    onModuleInit() {
        this.submissionService =
            this.client.getService<SubmissionService>('SubmissionService');

        this.tasksQueueService =
            this.client.getService<TasksQueueService>('TasksQueue');
    }


    // Calls gRPC to process a submission file
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
        //will implment logic later 
        return res;
    } catch (err) {
        throw err;
    }
}



}
