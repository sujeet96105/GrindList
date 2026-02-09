import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ReminderEntity } from '../entities/reminder.entity';
import { ReminderDto } from './dto/reminder.dto';
import { parseIsoDate } from '../common/date';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(ReminderEntity) private readonly reminders: Repository<ReminderEntity>
  ) {}

  async create(dto: ReminderDto) {
    const id = dto.id ?? randomUUID();
    const now = new Date();
    const reminder = this.reminders.create({
      id,
      taskId: dto.taskId,
      remindAt: parseIsoDate(dto.remindAt) ?? now,
      status: dto.status,
      createdAt: parseIsoDate(dto.createdAt) ?? now,
      updatedAt: parseIsoDate(dto.updatedAt) ?? now,
      deletedAt: parseIsoDate(dto.deletedAt),
    });
    return this.reminders.save(reminder);
  }

  async update(id: string, dto: ReminderDto) {
    const existing = await this.reminders.findOne({ where: { id } });
    if (!existing) return null;
    existing.taskId = dto.taskId ?? existing.taskId;
    existing.remindAt = parseIsoDate(dto.remindAt) ?? existing.remindAt;
    existing.status = dto.status ?? existing.status;
    existing.updatedAt = parseIsoDate(dto.updatedAt) ?? new Date();
    return this.reminders.save(existing);
  }

  async softDelete(id: string) {
    const existing = await this.reminders.findOne({ where: { id } });
    if (!existing) return null;
    existing.deletedAt = new Date();
    existing.updatedAt = new Date();
    return this.reminders.save(existing);
  }

  async listUpdatedSince(updatedAfter?: string) {
    if (!updatedAfter) return this.reminders.find();
    return this.reminders
      .createQueryBuilder('reminder')
      .where('reminder.updated_at > :updatedAfter', { updatedAfter })
      .getMany();
  }
}
