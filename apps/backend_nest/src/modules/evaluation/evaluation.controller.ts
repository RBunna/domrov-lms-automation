import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import * as grpcJs from '@grpc/grpc-js';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import * as evaluation from '../../libs/interfaces/evaluation';
import * as submission from '../../libs/interfaces/submission';

import { GetFilesSubmissionDto, GetSubmissionFolderDto } from '../../libs/dtos/submission/process-submission.dto';
import { AddQueueDto } from '../../libs/dtos/submission/add-queue.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubmissionService } from '../assessment/submission.service';

@ApiTags('evaluations')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService,
    private readonly submissionService: SubmissionService) { }

  @Get('submission')
  @ApiResponse({
    status: 200,
    description: 'view file in submisison',
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

  @Get('submission/folder-structure')
  @ApiResponse({
    status: 200,
    description: 'Folder structure retrieved',
    schema: {
      example: {
        success: true,
        message: 'Folder structure fetched',
        folder_structure: {
          name: 'repo',
          type: 'folder',
          children: [
            {
              name: 'src',
              type: 'folder',
              children: [
                { name: 'main.ts', type: 'file' },
                { name: 'utils.ts', type: 'file' }
              ]
            }
          ]
        }
      }
    }
  })
  async getSubmissionFolderStructure(
    @Query(new ValidationPipe({ transform: true }))
    query: GetSubmissionFolderDto,
  ) {
    const { submission_id } = query;

    return this.evaluationService.getSubmissionFolderStructure(
      String(submission_id),
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

      this.evaluationService.aiEvaluate(
        Number(submission_id), feedback, score.value, input_token, output_token
      )
      return {
        success: true,
        message: `Submission ${submission_id} evaluated successfully`,
      };
    } catch (err: unknown) {
      let message = 'Unknown error occurred';

      if (err instanceof Error) {
        message = err.message;
      }

      return {
        success: false,
        message,
      };
    }

  }

  @GrpcMethod('SubmissionService', 'GetSubmission')
  async getSubmission(
    data: submission.SubmissionContentRequest,
    metadata: grpcJs.Metadata,
    call: grpcJs.ServerUnaryCall<any, any>,
  ): Promise<submission.SubmissionContentResponse> {
    const { submission_id } = data;
    console.log('getSubmission called with:', data);

    const serverMetadata = new grpcJs.Metadata();
    serverMetadata.add('served-by', 'nestjs-grpc');
    call.sendMetadata(serverMetadata);

    try {
      const result = await this.submissionService.getSubmissionDetails(Number(submission_id));
      console.log('Submission found:', result);

      return result;
    } catch (err) {
      console.log('Error fetching submission:', (err as Error).message || err);
      throw new RpcException({
        code: grpcJs.status.NOT_FOUND,
        message: `Submission with id ${submission_id} not found`,
      });
    }
  }

  @GrpcMethod('SubmissionService', 'GetSubmissionResource')
  async getSubmissionResource(
    data: submission.SubmissionContentRequest, // reduce for resource
    metadata: grpcJs.Metadata,
    call: grpcJs.ServerUnaryCall<any, any>,
  ): Promise<submission.SubmissionContentResource> {
    const { submission_id } = data;

    const serverMetadata = new grpcJs.Metadata();
    serverMetadata.add('served-by', 'nestjs-grpc');
    call.sendMetadata(serverMetadata);

    try {
      const result = await this.submissionService.getSubmissionResoucrs(Number(submission_id));
      console.log('Submission found:', result);
      return result;
    } catch (err) {
      console.log('Error fetching submission:', (err as Error).message || err);
      throw new RpcException({
        code: grpcJs.status.NOT_FOUND,
        message: `Submission with id ${submission_id} not found`,
      });
    }
  }
}