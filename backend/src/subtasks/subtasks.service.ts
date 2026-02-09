import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SubtaskEntity } from '../entities/subtask.entity';
import { SubtaskDto } from './dto/subtask.dto';
import { parseIsoDate } from '../common/date';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectRepository(SubtaskEntity) private readonly subtasks: Repository<SubtaskEntity>
  ) {}

  async create(dto: SubtaskDto) {
    const id = dto.id ?? randomUUID();
    const now = new Date();
    const subtask = this.subtasks.create({
      id,
      taskId: dto.taskId,
      title: dto.title,
      status: dto.status,
      orderIndex: dto.orderIndex ?? 0,
      completionAt: parseIsoDate(dto.completionAt),
      createdAt: parseIsoDate(dto.createdAt) ?? now,
      updatedAt: parseIsoDate(dto.updatedAt) ?? now,
      deletedAt: parseIsoDate(dto.deletedAt),
    });
    return this.subtasks.save(subtask);
  }

  async update(id: string, dto: SubtaskDto) {
    const existing = await this.subtasks.findOne({ where: { id } });
    if (!existing) return null;
    existing.title = dto.title ?? existing.title;
    existing.status = dto.status ?? existing.status;
    existing.orderIndex = dto.orderIndex ?? existing.orderIndex;
    existing.completionAt = parseIsoDate(dto.completionAt) ?? existing.completionAt;
    existing.updatedAt = parseIsoDate(dto.updatedAt) ?? new Date();
    return this.subtasks.save(existing);
  }

  async softDelete(id: string) {
    const existing = await this.subtasks.findOne({ where: { id } });
    if (!existing) return null;
    existing.deletedAt = new Date();
    existing.updatedAt = new Date();
    return this.subtasks.save(existing);
  }

  async listByTask(taskId: string, updatedAfter?: string) {
    const qb = this.subtasks.createQueryBuilder('subtask').where('subtask.task_id = :taskId', {
      taskId,
    });
    if (updatedAfter) {
      qb.andWhere('subtask.updated_at > :updatedAfter', { updatedAfter });
    }
    return qb.orderBy('subtask.order_index', 'ASC').getMany();
  }
}
