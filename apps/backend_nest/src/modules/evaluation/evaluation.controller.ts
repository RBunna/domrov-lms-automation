import { Body, Controller, Get, Logger, Post, Query, ValidationPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import * as grpcJs from '@grpc/grpc-js';
import { GrpcMethod } from '@nestjs/microservices';
import * as evaluation from '../../../libs/interfaces/evaluation';
import { GetFilesSubmissionDto } from '../../../libs/dtos/submission/process-submission.dto';
import { AddQueueDto } from '../../../libs/dtos/submission/add-queue.dto';

@ApiTags('evaluations')
@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) { }

  @Get('process')
  @ApiResponse({
    status: 200,
    description: 'Submission processed',
    schema: {
      example: {
        success: true,
        message: 'File processed',
        file: {
          type: 'file',
          name: 'main.bat',
          path: '1a502673e8870d73/main.bat',
          content: [
            '@echo off',
            'REM This batch file compiles and runs the C++ Library Management System.',
            'out\\library_app.exe'
          ]
        }
      }
    }
  })
  async processSubmission(
    @Query(new ValidationPipe({ transform: true })) query: GetFilesSubmissionDto
  ) {
    const { submission_id, file_path } = query;
    return this.evaluationService.processSubmission(
      String(submission_id),
      String(file_path),
    );
  }

  @Post('queue')
  @ApiResponse({
    status: 200,
    description: 'Submission added to processing queue',
    schema: {
      example: {
        success: true,
        message: 'Task queued successfully',
      },
    },
  })
  async addQueue(
    @Body(new ValidationPipe({ transform: true }))
    body: AddQueueDto,
  ) {
    const { submission_id } = body;

    return this.evaluationService.addTaskToQueue(
      String(submission_id),
    );
  }



  @GrpcMethod('EvaluateWithAI', 'EvaluateSubmission')
  evaluateSubmission(
    data: evaluation.EvaluateRequest,
    metadata: grpcJs.Metadata,
    call: grpcJs.ServerUnaryCall<any, any>,
  ): evaluation.EvaluateResponse {

    const logger = new Logger('EvaluateSubmission');
    logger.log(`Received EvaluateSubmission request: ${JSON.stringify(data)}`);
    try {
      const { submission_id, score, feedback, input_token, output_token } = data;

      if (!submission_id || !score?.value?.length) {
        logger.log(`Invalid submission or empty score criteria: submission_id=${submission_id}, score=${JSON.stringify(score)}, feedback=${feedback}, input_token=${input_token}, output_token=${output_token}`);
        return {
          success: false,
          message: 'Invalid submission or empty score criteria',
        };
      }

      // Optionally send metadata back
      const serverMetadata = new grpcJs.Metadata();
      serverMetadata.add('evaluated-by', 'nestjs-grpc');
      call.sendMetadata(serverMetadata);

      return {
        success: true,
        message: `Submission ${submission_id} evaluated successfully`,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message,
      };
    }
  }

}
