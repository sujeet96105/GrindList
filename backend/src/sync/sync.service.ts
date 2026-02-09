import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { SubtaskEntity } from '../entities/subtask.entity';
import { TagEntity } from '../entities/tag.entity';
import { CategoryEntity } from '../entities/category.entity';
import { ReminderEntity } from '../entities/reminder.entity';
import { SyncItemDto } from './dto/sync.dto';
import { parseIsoDate } from '../common/date';

type PushResult = {
  accepted: string[];
  rejected: Array<{ entity_id: string; reason: string }>;
};

const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(TaskEntity) private readonly tasks: Repository<TaskEntity>,
    @InjectRepository(SubtaskEntity) private readonly subtasks: Repository<SubtaskEntity>,
    @InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ReminderEntity) private readonly reminders: Repository<ReminderEntity>
  ) {}

  private isNewer(incoming: Date, existing?: Date | null) {
    if (!existing) return true;
    return incoming.getTime() > existing.getTime();
  }

  async handleTask(item: SyncItemDto) {
    const incomingUpdatedAt = parseIsoDate(item.updated_at) ?? new Date();
    const existing = await this.tasks.findOne({ where: { id: item.entity_id }, relations: ['tags'] });

    if (item.action === 'delete') {
      if (!existing || this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
        const entity = existing ?? this.tasks.create({ id: item.entity_id });
        entity.deletedAt = incomingUpdatedAt;
        entity.updatedAt = incomingUpdatedAt;
        await this.tasks.save(entity);
      }
      return true;
    }

    const payload = item.payload ?? {};
    if (existing && !this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
      return false;
    }

    const entity = existing ?? this.tasks.create({ id: item.entity_id });
    entity.title = payload.title ?? entity.title;
    entity.description = payload.description ?? null;
    entity.dueDate = payload.dueDate ?? null;
    entity.priority = payload.priority ?? entity.priority ?? 'medium';
    entity.status = payload.status ?? entity.status ?? 'active';
    entity.categoryId = payload.categoryId ?? null;
    entity.recurrenceRule = payload.recurrenceRule ?? entity.recurrenceRule ?? 'none';
    entity.recurrenceInterval =
      payload.recurrenceInterval !== undefined ? payload.recurrenceInterval : entity.recurrenceInterval ?? null;
    entity.recurrenceEndDate =
      payload.recurrenceEndDate !== undefined ? payload.recurrenceEndDate : entity.recurrenceEndDate ?? null;
    entity.completionAt = parseIsoDate(payload.completionAt) ?? null;
    entity.createdAt = parseIsoDate(payload.createdAt) ?? incomingUpdatedAt;
    entity.updatedAt = incomingUpdatedAt;
    entity.deletedAt = parseIsoDate(payload.deletedAt);

    if (payload.tagIds?.length) {
      entity.tags = await this.tags.findBy({ id: In(payload.tagIds) });
    } else {
      entity.tags = [];
    }

    await this.tasks.save(entity);
    return true;
  }

  async handleSubtask(item: SyncItemDto) {
    const incomingUpdatedAt = parseIsoDate(item.updated_at) ?? new Date();
    const existing = await this.subtasks.findOne({ where: { id: item.entity_id } });

    if (item.action === 'delete') {
      if (!existing || this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
        const entity = existing ?? this.subtasks.create({ id: item.entity_id });
        entity.deletedAt = incomingUpdatedAt;
        entity.updatedAt = incomingUpdatedAt;
        await this.subtasks.save(entity);
      }
      return true;
    }

    const payload = item.payload ?? {};
    if (existing && !this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
      return false;
    }
    const entity = existing ?? this.subtasks.create({ id: item.entity_id });
    entity.taskId = payload.taskId ?? entity.taskId;
    entity.title = payload.title ?? entity.title;
    entity.status = payload.status ?? entity.status ?? 'active';
    entity.orderIndex = payload.orderIndex ?? entity.orderIndex ?? 0;
    entity.completionAt = parseIsoDate(payload.completionAt);
    entity.createdAt = parseIsoDate(payload.createdAt) ?? incomingUpdatedAt;
    entity.updatedAt = incomingUpdatedAt;
    entity.deletedAt = parseIsoDate(payload.deletedAt);
    await this.subtasks.save(entity);
    return true;
  }

  async handleTag(item: SyncItemDto) {
    const incomingUpdatedAt = parseIsoDate(item.updated_at) ?? new Date();
    const existing = await this.tags.findOne({ where: { id: item.entity_id } });
    if (item.action === 'delete') {
      if (!existing || this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
        const entity = existing ?? this.tags.create({ id: item.entity_id });
        entity.deletedAt = incomingUpdatedAt;
        entity.updatedAt = incomingUpdatedAt;
        await this.tags.save(entity);
      }
      return true;
    }
    const payload = item.payload ?? {};
    if (existing && !this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
      return false;
    }
    const entity = existing ?? this.tags.create({ id: item.entity_id });
    entity.name = payload.name ?? entity.name;
    entity.color = payload.color ?? null;
    entity.createdAt = parseIsoDate(payload.createdAt) ?? incomingUpdatedAt;
    entity.updatedAt = incomingUpdatedAt;
    entity.deletedAt = parseIsoDate(payload.deletedAt);
    await this.tags.save(entity);
    return true;
  }

  async handleCategory(item: SyncItemDto) {
    const incomingUpdatedAt = parseIsoDate(item.updated_at) ?? new Date();
    const existing = await this.categories.findOne({ where: { id: item.entity_id } });
    if (item.action === 'delete') {
      if (!existing || this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
        const entity = existing ?? this.categories.create({ id: item.entity_id });
        entity.deletedAt = incomingUpdatedAt;
        entity.updatedAt = incomingUpdatedAt;
        await this.categories.save(entity);
      }
      return true;
    }
    const payload = item.payload ?? {};
    if (existing && !this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
      return false;
    }
    const entity = existing ?? this.categories.create({ id: item.entity_id });
    entity.name = payload.name ?? entity.name;
    entity.color = payload.color ?? null;
    entity.createdAt = parseIsoDate(payload.createdAt) ?? incomingUpdatedAt;
    entity.updatedAt = incomingUpdatedAt;
    entity.deletedAt = parseIsoDate(payload.deletedAt);
    await this.categories.save(entity);
    return true;
  }

  async handleReminder(item: SyncItemDto) {
    const incomingUpdatedAt = parseIsoDate(item.updated_at) ?? new Date();
    const existing = await this.reminders.findOne({ where: { id: item.entity_id } });
    if (item.action === 'delete') {
      if (!existing || this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
        const entity = existing ?? this.reminders.create({ id: item.entity_id });
        entity.deletedAt = incomingUpdatedAt;
        entity.updatedAt = incomingUpdatedAt;
        await this.reminders.save(entity);
      }
      return true;
    }
    const payload = item.payload ?? {};
    if (existing && !this.isNewer(incomingUpdatedAt, existing.updatedAt)) {
      return false;
    }
    const entity = existing ?? this.reminders.create({ id: item.entity_id });
    entity.taskId = payload.taskId ?? entity.taskId;
    entity.remindAt = parseIsoDate(payload.remindAt) ?? incomingUpdatedAt;
    entity.status = payload.status ?? entity.status ?? 'scheduled';
    entity.createdAt = parseIsoDate(payload.createdAt) ?? incomingUpdatedAt;
    entity.updatedAt = incomingUpdatedAt;
    entity.deletedAt = parseIsoDate(payload.deletedAt);
    await this.reminders.save(entity);
    return true;
  }

  async push(items: SyncItemDto[]): Promise<PushResult> {
    const accepted: string[] = [];
    const rejected: Array<{ entity_id: string; reason: string }> = [];
    for (const item of items) {
      let ok = false;
      switch (item.entity_type) {
        case 'task':
          ok = await this.handleTask(item);
          break;
        case 'subtask':
          ok = await this.handleSubtask(item);
          break;
        case 'tag':
          ok = await this.handleTag(item);
          break;
        case 'category':
          ok = await this.handleCategory(item);
          break;
        case 'reminder':
          ok = await this.handleReminder(item);
          break;
        default:
          ok = false;
      }
      if (ok) {
        accepted.push(item.entity_id);
      } else {
        rejected.push({ entity_id: item.entity_id, reason: 'older_update' });
      }
    }
    return { accepted, rejected };
  }

  async pull(since: string): Promise<SyncItemDto[]> {
    const items: SyncItemDto[] = [];
    const tasks = await this.tasks
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.tags', 'tag')
      .where('task.updated_at > :since', { since })
      .getMany();
    for (const task of tasks) {
      items.push({
        entity_type: 'task',
        action: task.deletedAt ? 'delete' : 'upsert',
        entity_id: task.id,
        updated_at: task.updatedAt.toISOString(),
        payload: task.deletedAt
          ? { id: task.id }
          : {
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              priority: task.priority,
              status: task.status,
              categoryId: task.categoryId,
              recurrenceRule: task.recurrenceRule,
              recurrenceInterval: task.recurrenceInterval,
              recurrenceEndDate: task.recurrenceEndDate,
              completionAt: toIso(task.completionAt),
              createdAt: task.createdAt.toISOString(),
              updatedAt: task.updatedAt.toISOString(),
              deletedAt: toIso(task.deletedAt),
              tagIds: task.tags?.map((tag) => tag.id) ?? [],
            },
      });
    }

    const subtasks = await this.subtasks
      .createQueryBuilder('subtask')
      .where('subtask.updated_at > :since', { since })
      .getMany();
    for (const subtask of subtasks) {
      items.push({
        entity_type: 'subtask',
        action: subtask.deletedAt ? 'delete' : 'upsert',
        entity_id: subtask.id,
        updated_at: subtask.updatedAt.toISOString(),
        payload: subtask.deletedAt
          ? { id: subtask.id }
          : {
              id: subtask.id,
              taskId: subtask.taskId,
              title: subtask.title,
              status: subtask.status,
              orderIndex: subtask.orderIndex,
              completionAt: toIso(subtask.completionAt),
              createdAt: subtask.createdAt.toISOString(),
              updatedAt: subtask.updatedAt.toISOString(),
              deletedAt: toIso(subtask.deletedAt),
            },
      });
    }

    const tags = await this.tags
      .createQueryBuilder('tag')
      .where('tag.updated_at > :since', { since })
      .getMany();
    for (const tag of tags) {
      items.push({
        entity_type: 'tag',
        action: tag.deletedAt ? 'delete' : 'upsert',
        entity_id: tag.id,
        updated_at: tag.updatedAt.toISOString(),
        payload: tag.deletedAt
          ? { id: tag.id }
          : {
              id: tag.id,
              name: tag.name,
              color: tag.color,
              createdAt: tag.createdAt.toISOString(),
              updatedAt: tag.updatedAt.toISOString(),
              deletedAt: toIso(tag.deletedAt),
            },
      });
    }

    const categories = await this.categories
      .createQueryBuilder('category')
      .where('category.updated_at > :since', { since })
      .getMany();
    for (const category of categories) {
      items.push({
        entity_type: 'category',
        action: category.deletedAt ? 'delete' : 'upsert',
        entity_id: category.id,
        updated_at: category.updatedAt.toISOString(),
        payload: category.deletedAt
          ? { id: category.id }
          : {
              id: category.id,
              name: category.name,
              color: category.color,
              createdAt: category.createdAt.toISOString(),
              updatedAt: category.updatedAt.toISOString(),
              deletedAt: toIso(category.deletedAt),
            },
      });
    }

    const reminders = await this.reminders
      .createQueryBuilder('reminder')
      .where('reminder.updated_at > :since', { since })
      .getMany();
    for (const reminder of reminders) {
      items.push({
        entity_type: 'reminder',
        action: reminder.deletedAt ? 'delete' : 'upsert',
        entity_id: reminder.id,
        updated_at: reminder.updatedAt.toISOString(),
        payload: reminder.deletedAt
          ? { id: reminder.id }
          : {
              id: reminder.id,
              taskId: reminder.taskId,
              remindAt: reminder.remindAt.toISOString(),
              status: reminder.status,
              createdAt: reminder.createdAt.toISOString(),
              updatedAt: reminder.updatedAt.toISOString(),
              deletedAt: toIso(reminder.deletedAt),
            },
      });
    }

    return items;
  }
}
