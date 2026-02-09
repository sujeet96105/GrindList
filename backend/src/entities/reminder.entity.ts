import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('reminders')
export class ReminderEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'task_id' })
  taskId: string;

  @Column({ type: 'timestamptz', name: 'remind_at' })
  remindAt: Date;

  @Column({ type: 'varchar', length: 12 })
  status: string;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;
}
