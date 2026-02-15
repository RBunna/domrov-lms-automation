import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class R2Service {
  private s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto', // or 'eu' if using EU endpoint
      endpoint: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_TOKEN')!,
        secretAccessKey: this.configService.get<string>('R2_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  async getUploadUrl(filename: string, contentType: string) {
    const bucket = this.configService.get<string>('R2_BUCKET')!;
    const key = `uploads/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 300, // 5 minutes
    });

    return { uploadUrl, key };
  }
}