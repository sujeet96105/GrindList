import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class SubtaskDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  taskId: string;

  @IsString()
  title: string;

  @IsString()
  status: string;

  orderIndex: number;

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
}
