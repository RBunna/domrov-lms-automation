import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { UserId } from '../../common/decorators/user.decorator';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import express from 'express';
import { IsNotEmpty, IsString } from 'class-validator';
export class NotifyUploadDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  filename: string;
}
@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  /**
   * GET /file/presigned-url?filename=xxx&contentType=yyy&resourceType=module&resourceId=123
   * Returns a presigned PUT URL for uploading files directly to R2
   */
  @Get('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for uploading a file to R2' })
  @ApiQuery({ name: 'filename', required: true, type: String })
  @ApiQuery({ name: 'contentType', required: true, type: String })
  @ApiQuery({
    name: 'resourceType',
    required: true,
    enum: ['module', 'topic', 'assessment', 'class', 'submission'],
  })
  @ApiQuery({ name: 'resourceId', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
    @Query('resourceType') resourceType: 'module' | 'topic' | 'assessment' | 'class' | 'submission',
    @Query('resourceId') resourceId: number,
    @UserId() userId: number
  ) {
    if (!filename || !contentType || !resourceType || !resourceId) {
      throw new Error('Missing required query params');
    }

    return this.fileService.generatePresignedUrl(userId, resourceType, resourceId, filename, contentType);
  }

  /**
   * POST /file/notify-upload
   * Frontend calls this after successful R2 upload
   */
  @Post('notify-upload')
  @ApiOperation({ summary: 'Notify backend that file upload to R2 was successful' })
  @ApiBody({ type: NotifyUploadDto })
  @ApiResponse({ status: 201, description: 'Resource saved successfully' })
  async notifyUpload(
    @UserId() userId: number,
    @Body() body: NotifyUploadDto
  ) {
    const { key, filename } = body;
    if (!key || !filename) {
      throw new Error('Missing required body params');
    }

    return this.fileService.notifyUploadSuccess(userId, key, filename);
  }

  @Get('download/:resourceId')
  @UseGuards(JwtAuthGuard)
  async download(
    @Param('resourceId') resourceId: number,
    @Res() res: express.Response, // Use Express Response type
    @UserId() userId: number,
  ) {
    const { stream, filename, contentType } = await this.fileService.getResourceStream(userId, resourceId);
    const encodedFileName = encodeURIComponent(filename);
    const safeFileName = encodedFileName.replace(/%20/g, ' '); // optional: fix spaces
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`
    );
    res.setHeader('Content-Type', contentType || 'application/octet-stream');

    // Pipe the stream to response
    return new Promise<void>((resolve, reject) => {
      stream.pipe(res)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

}