import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { RedisService } from './redis.service';

@Module({
    providers: [TasksService, RedisService],
    exports: [TasksService], // export if other modules need to push tasks
})
export class TasksModule { }
