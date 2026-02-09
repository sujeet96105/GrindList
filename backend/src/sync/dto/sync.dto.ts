import { IsArray, IsIn, IsISO8601, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncItemDto {
  @IsIn(['task', 'subtask', 'tag', 'category', 'reminder'])
  entity_type: string;

  @IsIn(['upsert', 'delete'])
  action: string;

  @IsString()
  entity_id: string;

  @IsISO8601()
  updated_at: string;

  @IsOptional()
  payload?: any;
}

export class SyncPushDto {
  @IsString()
  device_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items: SyncItemDto[];
}

export class SyncPullResponse {
  since: string;
  items: SyncItemDto[];
}
