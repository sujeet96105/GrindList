import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TaskEntity } from './entities/task.entity';
import { SubtaskEntity } from './entities/subtask.entity';
import { TagEntity } from './entities/tag.entity';
import { CategoryEntity } from './entities/category.entity';
import { ReminderEntity } from './entities/reminder.entity';
import { UserEntity } from './entities/user.entity';

const migrations =
  process.env.TYPEORM_MIGRATIONS === 'dist'
    ? ['dist/migrations/*.js']
    : ['src/migrations/*.ts'];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'grindlist',
  entities: [TaskEntity, SubtaskEntity, TagEntity, CategoryEntity, ReminderEntity, UserEntity],
  migrations,
  synchronize: false,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
      : false,
});
