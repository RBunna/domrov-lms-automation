import { Module } from '@nestjs/common';
import { UserAiService } from './user-ai.service';
import { UserAiController } from './user-ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';
import { AIUsageLogService } from './ai-usage-log.service';
import { AIUsageLog } from '../../libs/entities/ai/ai-usage-log.entity';
import { User } from '../../libs/entities/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAIKey,
      AIUsageLog,
      User,
    ]),
  ],
  controllers: [UserAiController],
  providers: [UserAiService, AIUsageLogService],
  exports: [AIUsageLogService],
})
export class UserAiModule { }
