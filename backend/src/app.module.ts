import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskEntity } from './entities/task.entity';
import { SubtaskEntity } from './entities/subtask.entity';
import { TagEntity } from './entities/tag.entity';
import { CategoryEntity } from './entities/category.entity';
import { ReminderEntity } from './entities/reminder.entity';
import { UserEntity } from './entities/user.entity';
import { TasksModule } from './tasks/tasks.module';
import { SubtasksModule } from './subtasks/subtasks.module';
import { TagsModule } from './tags/tags.module';
import { CategoriesModule } from './categories/categories.module';
import { RemindersModule } from './reminders/reminders.module';
import { SyncModule } from './sync/sync.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(Number(process.env.RATE_LIMIT_TTL ?? 60)),
          limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
        },
      ],
    }),
    TypeOrmModule.forRoot(() => {
      const sslValue = (process.env.DB_SSL ?? '').toLowerCase();
      const sslEnabled = ['true', '1', 'require', 'required'].includes(sslValue);
      const rejectUnauthorized =
        (process.env.DB_SSL_REJECT_UNAUTHORIZED ?? '').toLowerCase() === 'true';
      const ssl = sslEnabled ? { rejectUnauthorized } : false;

      const url = process.env.DATABASE_URL;

      return {
        type: 'postgres',
        ...(url
          ? { url }
          : {
              host: process.env.DB_HOST ?? 'localhost',
              port: Number(process.env.DB_PORT ?? 5432),
              username: process.env.DB_USER ?? 'postgres',
              password: process.env.DB_PASS ?? 'postgres',
              database: process.env.DB_NAME ?? 'grindlist',
            }),
        entities: [
          TaskEntity,
          SubtaskEntity,
          TagEntity,
          CategoryEntity,
          ReminderEntity,
          UserEntity,
        ],
        synchronize: false,
        ssl,
      };
    }),
    TasksModule,
    SubtasksModule,
    TagsModule,
    CategoriesModule,
    RemindersModule,
    SyncModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
