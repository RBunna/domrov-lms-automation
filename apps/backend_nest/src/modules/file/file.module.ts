import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { R2Service } from '../../services/r2.service';

@Module({
  controllers: [FileController],
  providers: [FileService,R2Service],
})
export class FileModule {}
