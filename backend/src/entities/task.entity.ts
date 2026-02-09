import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';
import { TagEntity } from './tag.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: string | null;

  @Column({ type: 'varchar', length: 10 })
  priority: string;

  @Column({ type: 'varchar', length: 10 })
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'category_id' })
  categoryId: string | null;

  @Column({ type: 'varchar', length: 10, name: 'recurrence_rule', default: 'none' })
  recurrenceRule: string;

  @Column({ type: 'int', nullable: true, name: 'recurrence_interval' })
  recurrenceInterval: number | null;

  @Column({ type: 'date', nullable: true, name: 'recurrence_end_date' })
  recurrenceEndDate: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completion_at' })
  completionAt: Date | null;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToMany(() => TagEntity, { cascade: false })
  @JoinTable({
    name: 'task_tags',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: TagEntity[];
}
