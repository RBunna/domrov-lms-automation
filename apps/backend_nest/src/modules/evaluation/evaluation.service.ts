import { Injectable, OnModuleInit, Inject, NotFoundException } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

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
        } catch (err) {
            console.error('gRPC error:', err.message);

            if (err.code === 5) {
                throw new NotFoundException(`File not found or empty: ${file_path}`);
            }

            throw err;
        }
    }

    async addTaskToQueue(submission_id: string) {
        return await lastValueFrom(
            this.tasksQueueService.AddQueue({
                submission_id,
            }),
        );
    }

}
