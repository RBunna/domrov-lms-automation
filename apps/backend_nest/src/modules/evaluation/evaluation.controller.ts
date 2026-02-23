import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query, UseGuards, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import * as grpcJs from '@grpc/grpc-js';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import * as evaluation from '../../libs/interfaces/evaluation';
import * as submission from '../../libs/interfaces/submission';

import { GetFilesSubmissionDto, GetSubmissionFolderDto } from '../../libs/dtos/submission/process-submission.dto';
import { AddQueueDto } from '../../libs/dtos/submission/add-queue.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiOkResponse, 
  ApiNotFoundResponse, 
  ApiBadRequestResponse,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { SubmissionService } from '../assessment/submission.service';
import {
  ProcessSubmissionResponseDto,
  FolderStructureResponseDto,
  AddQueueResponseDto,
} from '../../libs/dtos/evaluation/evaluation-response.dto';

@ApiTags('Evaluations')
@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService,
    private readonly submissionService: SubmissionService) { }

  // ==================== VIEW FILE CONTENT ====================
  @Get('submission')
  @ApiOperation({ 
    summary: 'View file content in submission',
    description: 'Retrieves the content of a specific file from a submission. Used by the code viewer to display source code with syntax highlighting.'
  })
  @ApiQuery({ name: 'submission_id', type: Number, description: 'Submission ID', example: 1 })
  @ApiQuery({ name: 'file_path', type: String, description: 'Relative file path within submission', example: 'src/main.cpp' })
  @ApiOkResponse({
    description: 'File content retrieved successfully',
    type: ProcessSubmissionResponseDto,
    example: {
      success: true,
      message: 'File processed',
      file: {
        type: 'file',
        name: 'main.cpp',
        path: '1a502673e8870d73/main.cpp',
        content: [
          '#include <iostream>',
          '#include "utils/helper.h"',
          '',
          'int main() {',
          '    std::cout << "Hello World" << std::endl;',
          '    return 0;',
          '}'
        ]
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'File not found',
    example: {
      statusCode: 404,
      message: 'File not found or empty: src/missing.cpp',
      error: 'Not Found'
    }
  })
  async processSubmission(
    @Query(new ValidationPipe({ transform: true })) query: GetFilesSubmissionDto
  ): Promise<ProcessSubmissionResponseDto> {
    const { submission_id, file_path } = query;
    return this.evaluationService.processSubmission(
      String(submission_id),
      String(file_path),
    );
  }

  // ==================== GET FOLDER STRUCTURE ====================
  @Get('submission/folder-structure')
  @ApiOperation({ 
    summary: 'Get submission folder structure',
    description: 'Retrieves the complete folder tree structure of a submission. Used to render the file explorer sidebar in the code viewer.'
  })
  @ApiQuery({ name: 'submission_id', type: Number, description: 'Submission ID', example: 1 })
  @ApiOkResponse({
    description: 'Folder structure retrieved successfully',
    type: FolderStructureResponseDto,
    example: {
      success: true,
      message: 'Folder structure fetched',
      folder_structure: {
        name: 'submission_root',
        type: 'folder',
        children: [
          {
            name: 'src',
            type: 'folder',
            children: [
              { name: 'main.cpp', type: 'file' },
              { name: 'utils.cpp', type: 'file' },
              { name: 'utils.h', type: 'file' }
            ]
          },
          {
            name: 'models',
            type: 'folder',
            children: [
              { name: 'book.cpp', type: 'file' },
              { name: 'book.h', type: 'file' }
            ]
          },
          { name: 'README.md', type: 'file' },
          { name: 'main.bat', type: 'file' }
        ]
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Submission not found',
    example: {
      statusCode: 404,
      message: 'Submission structure not found for ID: 999',
      error: 'Not Found'
    }
  })
  async getSubmissionFolderStructure(
    @Query(new ValidationPipe({ transform: true }))
    query: GetSubmissionFolderDto,
  ): Promise<FolderStructureResponseDto> {
    const { submission_id } = query;

    return this.evaluationService.getSubmissionFolderStructure(
      String(submission_id),
    );
  }

  // ==================== ADD TO AI EVALUATION QUEUE ====================
  @Post('queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Queue submission for AI evaluation',
    description: `Adds a submission to the AI evaluation processing queue. The submission will be evaluated asynchronously by the AI grading system.

**Workflow:**
1. Student submits assignment via \`PATCH /submissions/:assessmentId/submit\`
2. Teacher triggers AI evaluation by calling this endpoint
3. AI processes submission and creates evaluation with scores and feedback
4. Teacher reviews and approves the AI evaluation

**Requirements:**
- Submission must exist and have status SUBMITTED
- Assessment must have \`aiEvaluationEnable: true\`
- Class owner must have sufficient wallet credits for AI usage

**Future Enhancement:** This endpoint will support both AI and manual evaluation modes.`
  })
  @ApiBody({ 
    type: AddQueueDto,
    description: 'Submission to queue for AI evaluation',
    examples: {
      basic: {
        summary: 'Queue single submission',
        value: { submission_id: '123' }
      }
    }
  })
  @ApiOkResponse({
    description: 'Submission queued successfully',
    type: AddQueueResponseDto,
    example: {
      success: true,
      message: 'Task queued successfully'
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid submission or queue error',
    examples: {
      notFound: {
        summary: 'Submission not found',
        value: {
          statusCode: 400,
          message: 'Submission not found',
          error: 'Bad Request'
        }
      },
      alreadyGraded: {
        summary: 'Already graded',
        value: {
          statusCode: 400,
          message: 'Submission already has an evaluation',
          error: 'Bad Request'
        }
      },
      aiDisabled: {
        summary: 'AI evaluation disabled',
        value: {
          statusCode: 400,
          message: 'AI evaluation is not enabled for this assessment',
          error: 'Bad Request'
        }
      },
      insufficientCredits: {
        summary: 'Insufficient credits',
        value: {
          statusCode: 400,
          message: 'Insufficient wallet credits for AI evaluation',
          error: 'Bad Request'
        }
      }
    }
  })
  async addQueue(
    @Body(new ValidationPipe({ transform: true }))
    body: AddQueueDto,
  ): Promise<AddQueueResponseDto> {
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