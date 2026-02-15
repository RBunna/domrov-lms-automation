import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { R2Service } from '../../services/r2.service';

@ApiTags('Files')
@Controller('file')
export class FileController {
  constructor(private readonly r2Service: R2Service) { }

  /**
   * GET /file/presigned-url?filename=xxx&contentType=yyy
   * Returns a presigned PUT URL for uploading files directly to R2
   */
  @Get('presigned-url')
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    if (!filename) throw new Error("filename query param is required");
    if (!contentType) throw new Error("contentType query param is required");

    return this.r2Service.getUploadUrl(filename, contentType);
  }
}