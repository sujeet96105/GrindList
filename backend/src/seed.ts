import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AppDataSource } from './data-source';
import { UserEntity } from './entities/user.entity';
import { TagEntity } from './entities/tag.entity';
import { CategoryEntity } from './entities/category.entity';
import { TaskEntity } from './entities/task.entity';
import { SubtaskEntity } from './entities/subtask.entity';
import { ReminderEntity } from './entities/reminder.entity';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const tagRepo = AppDataSource.getRepository(TagEntity);
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const taskRepo = AppDataSource.getRepository(TaskEntity);
  const subtaskRepo = AppDataSource.getRepository(SubtaskEntity);
  const reminderRepo = AppDataSource.getRepository(ReminderEntity);

  const now = new Date();
  const userEmail = 'demo@grindlist.app';
  const existingUser = await userRepo.findOne({ where: { email: userEmail } });
  let user = existingUser;
  if (!user) {
    user = userRepo.create({
      id: `u_${randomUUID()}`,
      email: userEmail,
      passwordHash: await bcrypt.hash('password123', 10),
      createdAt: now,
      updatedAt: now,
    });
    await userRepo.save(user);
  }

  const workCategory = await categoryRepo.save(
    categoryRepo.create({
      id: `cat_${randomUUID()}`,
      name: 'Work',
      color: '#FFB703',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );

  const personalCategory = await categoryRepo.save(
    categoryRepo.create({
      id: `cat_${randomUUID()}`,
      name: 'Personal',
      color: '#219EBC',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );

  const tagUrgent = await tagRepo.save(
    tagRepo.create({
      id: `tag_${randomUUID()}`,
      name: 'urgent',
      color: '#E63946',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );

  const tagDeepWork = await tagRepo.save(
    tagRepo.create({
      id: `tag_${randomUUID()}`,
      name: 'deep-work',
      color: '#3A86FF',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );

  const task = taskRepo.create({
    id: `t_${randomUUID()}`,
    title: 'Finish quarterly report',
    description: 'Compile KPIs and draft the summary section.',
    dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    status: 'active',
    categoryId: workCategory.id,
    completionAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    tags: [tagUrgent, tagDeepWork],
  });
  await taskRepo.save(task);

  const subtaskOne = subtaskRepo.create({
    id: `st_${randomUUID()}`,
    taskId: task.id,
    title: 'Pull analytics export',
    status: 'active',
    orderIndex: 0,
    completionAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  const subtaskTwo = subtaskRepo.create({
    id: `st_${randomUUID()}`,
    taskId: task.id,
    title: 'Draft summary notes',
    status: 'active',
    orderIndex: 1,
    completionAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  await subtaskRepo.save([subtaskOne, subtaskTwo]);

  await reminderRepo.save(
    reminderRepo.create({
      id: `rem_${randomUUID()}`,
      taskId: task.id,
      remindAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );

  await taskRepo.save(
    taskRepo.create({
      id: `t_${randomUUID()}`,
      title: 'Call mom',
      description: 'Weekly check-in.',
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      status: 'active',
      categoryId: personalCategory.id,
      completionAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      tags: [],
    })
  );

  await AppDataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
