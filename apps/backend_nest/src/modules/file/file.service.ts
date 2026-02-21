import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { R2Service } from '../../services/r2.service';
import { ResourceType } from '../../libs/enums/Resource';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '../../libs/entities/resource/resource.entity';
import { Readable } from 'stream';

@Injectable()
export class FileService {
  constructor(
    private readonly r2Service: R2Service,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,

  ) { }

  async generatePresignedUrl(
    userId: number,
    parentType: 'module' | 'topic' | 'assessment' | 'class' | 'submission',
    parentId: number,
    filename: string,
    contentType: string,
  ) {

    const key = `${userId}/${parentType}/${parentId}/${filename}`;
    const { uploadUrl } = await this.r2Service.getUploadUrl(key, contentType);

    return { uploadUrl, key };
  }

  async notifyUploadSuccess(
    userId: number,
    key: string,
    filename: string,
  ) {
    // Check if file exists in R2
    const exists = await this.r2Service.objectExists(key);
    if (!exists) throw new NotFoundException('File not found in storage');

    // Map extension to ResourceType
    const type = getResourceTypeFromFilename(filename);

    // Save to DB
    const resource = this.resourceRepo.create({
      title: filename,
      type, // mapped file type
      url: key,
      owner: `${userId}`,
    });
    return this.resourceRepo.save(resource);
  }

  async getResourceStream(userId: number, resourceId: number): Promise<{
    stream: Readable;
    filename: string;
    contentType: string;
  }> {
    const resource = await this.resourceRepo.findOne({ where: { id: resourceId } });
    if (!resource) throw new NotFoundException('Resource not found');

    if (resource.owner !== `${userId}` && !this.canAccess(userId, resource)) {
      throw new ForbiddenException('Unauthorized');
    }

    // Get the object from R2
    const { stream, contentType } = await this.r2Service.streamFile(resource.url);

    return {
      stream,
      filename: resource.title.trim(),
      contentType,
    };
  }

  // Dummy permission check — implement your logic
  canAccess(userId: number, resource: Resource): boolean {
    // e.g., check if resource is shared with user
    return true;
  }

}

function getResourceTypeFromFilename(filename: string): ResourceType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return ResourceType.IMAGE;
  if (['mp4', 'mov', 'avi'].includes(ext)) return ResourceType.VIDEO;
  if (['pdf', 'doc', 'docx', 'txt', 'java', 'js', 'py'].includes(ext)) return ResourceType.DOCUMENT;
  return ResourceType.FILE;
}