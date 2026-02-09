import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class ReminderDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  taskId: string;

  @IsISO8601()
  remindAt: string;

  @IsString()
  status: string;

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
