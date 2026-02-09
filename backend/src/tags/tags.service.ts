import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { TagEntity } from '../entities/tag.entity';
import { TagDto } from './dto/tag.dto';
import { parseIsoDate } from '../common/date';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}

  async create(dto: TagDto) {
    const id = dto.id ?? randomUUID();
    const now = new Date();
    const tag = this.tags.create({
      id,
      name: dto.name,
      color: dto.color ?? null,
      createdAt: parseIsoDate(dto.createdAt) ?? now,
      updatedAt: parseIsoDate(dto.updatedAt) ?? now,
      deletedAt: parseIsoDate(dto.deletedAt),
    });
    return this.tags.save(tag);
  }

  async update(id: string, dto: TagDto) {
    const existing = await this.tags.findOne({ where: { id } });
    if (!existing) return null;
    existing.name = dto.name ?? existing.name;
    existing.color = dto.color ?? existing.color;
    existing.updatedAt = parseIsoDate(dto.updatedAt) ?? new Date();
    return this.tags.save(existing);
  }

  async softDelete(id: string) {
    const existing = await this.tags.findOne({ where: { id } });
    if (!existing) return null;
    existing.deletedAt = new Date();
    existing.updatedAt = new Date();
    return this.tags.save(existing);
  }

  async listUpdatedSince(updatedAfter?: string) {
    if (!updatedAfter) return this.tags.find();
    return this.tags
      .createQueryBuilder('tag')
      .where('tag.updated_at > :updatedAfter', { updatedAfter })
      .getMany();
  }
}
