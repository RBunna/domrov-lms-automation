import { Injectable, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { MAX_FILE_SIZE } from '../../libs/const/system';
import { Readable } from 'stream';

@Injectable()
export class R2Service {
  private s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_TOKEN')!,
        secretAccessKey: this.configService.get<string>('R2_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  async getUploadUrl(key: string, contentType: string) {
    const bucket = this.configService.get<string>('R2_BUCKET')!;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      // ContentLength: MAX_FILE_SIZE
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return { uploadUrl, key };
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.configService.get<string>('R2_BUCKET'),
          Key: key,
        }),
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async streamFile(key: string): Promise<{ stream: Readable; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    });

    const r2Object = await this.s3.send(command);

    if (!r2Object.Body) throw new NotFoundException('File not found');

    // Ensure NodeJS Readable
    let stream: Readable;
    if (r2Object.Body instanceof Readable) {
      stream = r2Object.Body;
    } else {
      // Convert Web stream or async iterable to NodeJS Readable
      const chunks: Buffer[] = [];
      for await (const chunk of r2Object.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      stream = Readable.from(Buffer.concat(chunks));
    }

    return {
      stream,
      contentType: r2Object.ContentType || 'application/octet-stream',
    };
  }


}