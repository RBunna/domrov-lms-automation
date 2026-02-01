import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface SubmissionService {
    processSubmission(request: { submission_id: string; file_path: string }): Observable<any>;
}

@Injectable()
export class EvaluationService implements OnModuleInit {
    private submissionService: SubmissionService;

    constructor(
        @Inject('SUBMISSION_PACKAGE') private readonly client: microservices.ClientGrpc,
    ) { }

    onModuleInit() {
        this.submissionService = this.client.getService<SubmissionService>('SubmissionService');
    }

    // Calls gRPC to process a submission file
    processSubmission(submission_id: string, file_path: string): Observable<any> {
        return this.submissionService.processSubmission({ submission_id, file_path });
    }
}
