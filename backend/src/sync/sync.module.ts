import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../entities/task.entity';
import { SubtaskEntity } from '../entities/subtask.entity';
import { TagEntity } from '../entities/tag.entity';
import { CategoryEntity } from '../entities/category.entity';
import { ReminderEntity } from '../entities/reminder.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, SubtaskEntity, TagEntity, CategoryEntity, ReminderEntity])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
