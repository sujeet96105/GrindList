import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class TaskDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsIn(['high', 'medium', 'low'])
  priority: string;

  @IsIn(['active', 'completed'])
  status: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  recurrenceInterval?: number | null;

  @IsOptional()
  @IsString()
  recurrenceEndDate?: string | null;

  @IsOptional()
  @IsISO8601()
  completionAt?: string | null;

  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @IsOptional()
  @IsISO8601()
  updatedAt?: string;

  @IsOptional()
  @IsISO8601()
  deletedAt?: string | null;

  @IsOptional()
  tagIds?: string[];
}
