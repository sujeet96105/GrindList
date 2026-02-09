import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { TaskEntity } from '../entities/task.entity';
import { TagEntity } from '../entities/tag.entity';
import { TaskDto } from './dto/task.dto';
import { parseIsoDate } from '../common/date';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private readonly tasks: Repository<TaskEntity>,
    @InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>
  ) {}

  async create(dto: TaskDto) {
    const id = dto.id ?? randomUUID();
    const now = new Date();
    const task = this.tasks.create({
      id,
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ?? null,
      priority: dto.priority,
      status: dto.status,
      categoryId: dto.categoryId ?? null,
      recurrenceRule: dto.recurrenceRule ?? 'none',
      recurrenceInterval: dto.recurrenceInterval ?? null,
      recurrenceEndDate: dto.recurrenceEndDate ?? null,
      completionAt: parseIsoDate(dto.completionAt) ?? null,
      createdAt: parseIsoDate(dto.createdAt) ?? now,
      updatedAt: parseIsoDate(dto.updatedAt) ?? now,
      deletedAt: parseIsoDate(dto.deletedAt),
    });
    if (dto.tagIds?.length) {
      task.tags = await this.tags.findBy({ id: In(dto.tagIds) });
    }
    return this.tasks.save(task);
  }

  async findById(id: string) {
    return this.tasks.findOne({ where: { id }, relations: ['tags'] });
  }

  async update(id: string, dto: TaskDto) {
    const existing = await this.findById(id);
    if (!existing) return null;
    existing.title = dto.title ?? existing.title;
    existing.description = dto.description ?? existing.description;
    existing.dueDate = dto.dueDate ?? existing.dueDate;
    existing.priority = dto.priority ?? existing.priority;
    existing.status = dto.status ?? existing.status;
    existing.categoryId = dto.categoryId ?? existing.categoryId;
    existing.recurrenceRule = dto.recurrenceRule ?? existing.recurrenceRule;
    existing.recurrenceInterval =
      dto.recurrenceInterval !== undefined ? dto.recurrenceInterval : existing.recurrenceInterval;
    existing.recurrenceEndDate =
      dto.recurrenceEndDate !== undefined ? dto.recurrenceEndDate : existing.recurrenceEndDate;
    existing.completionAt = parseIsoDate(dto.completionAt) ?? existing.completionAt;
    existing.updatedAt = parseIsoDate(dto.updatedAt) ?? new Date();
    if (dto.tagIds) {
      existing.tags = await this.tags.findBy({ id: In(dto.tagIds) });
    }
    return this.tasks.save(existing);
  }

  async softDelete(id: string) {
    const existing = await this.findById(id);
    if (!existing) return null;
    existing.deletedAt = new Date();
    existing.updatedAt = new Date();
    return this.tasks.save(existing);
  }

  async listUpdatedSince(updatedAfter?: string) {
    if (!updatedAfter) {
      return this.tasks.find({ relations: ['tags'] });
    }
    return this.tasks
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.tags', 'tag')
      .where('task.updated_at > :updatedAfter', { updatedAfter })
      .getMany();
  }
}
