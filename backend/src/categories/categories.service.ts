import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryDto } from './dto/category.dto';
import { parseIsoDate } from '../common/date';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>
  ) {}

  async create(dto: CategoryDto) {
    const id = dto.id ?? randomUUID();
    const now = new Date();
    const category = this.categories.create({
      id,
      name: dto.name,
      color: dto.color ?? null,
      createdAt: parseIsoDate(dto.createdAt) ?? now,
      updatedAt: parseIsoDate(dto.updatedAt) ?? now,
      deletedAt: parseIsoDate(dto.deletedAt),
    });
    return this.categories.save(category);
  }

  async update(id: string, dto: CategoryDto) {
    const existing = await this.categories.findOne({ where: { id } });
    if (!existing) return null;
    existing.name = dto.name ?? existing.name;
    existing.color = dto.color ?? existing.color;
    existing.updatedAt = parseIsoDate(dto.updatedAt) ?? new Date();
    return this.categories.save(existing);
  }

  async softDelete(id: string) {
    const existing = await this.categories.findOne({ where: { id } });
    if (!existing) return null;
    existing.deletedAt = new Date();
    existing.updatedAt = new Date();
    return this.categories.save(existing);
  }

  async listUpdatedSince(updatedAfter?: string) {
    if (!updatedAfter) return this.categories.find();
    return this.categories
      .createQueryBuilder('category')
      .where('category.updated_at > :updatedAfter', { updatedAfter })
      .getMany();
  }
}
