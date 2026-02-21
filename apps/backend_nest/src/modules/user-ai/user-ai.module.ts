import { Module } from '@nestjs/common';
import { UserAiService } from './user-ai.service';
import { UserAiController } from './user-ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAIKey
    ]),
  ],
  controllers: [UserAiController],
  providers: [UserAiService],
})
export class UserAiModule { }
