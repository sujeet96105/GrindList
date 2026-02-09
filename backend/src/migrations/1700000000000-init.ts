import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS users (
      id varchar(64) PRIMARY KEY NOT NULL,
      email varchar(160) NOT NULL UNIQUE,
      password_hash varchar(255) NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS tasks (
      id varchar(64) PRIMARY KEY NOT NULL,
      title varchar(200) NOT NULL,
      description varchar(500),
      due_date date,
      priority varchar(10) NOT NULL,
      status varchar(10) NOT NULL,
      category_id varchar(64),
      completion_at timestamptz,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      deleted_at timestamptz
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS tags (
      id varchar(64) PRIMARY KEY NOT NULL,
      name varchar(80) NOT NULL UNIQUE,
      color varchar(20),
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      deleted_at timestamptz
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS task_tags (
      task_id varchar(64) NOT NULL,
      tag_id varchar(64) NOT NULL,
      PRIMARY KEY (task_id, tag_id)
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS categories (
      id varchar(64) PRIMARY KEY NOT NULL,
      name varchar(80) NOT NULL UNIQUE,
      color varchar(20),
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      deleted_at timestamptz
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS subtasks (
      id varchar(64) PRIMARY KEY NOT NULL,
      task_id varchar(64) NOT NULL,
      title varchar(200) NOT NULL,
      status varchar(10) NOT NULL,
      order_index int NOT NULL,
      completion_at timestamptz,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      deleted_at timestamptz
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS reminders (
      id varchar(64) PRIMARY KEY NOT NULL,
      task_id varchar(64) NOT NULL,
      remind_at timestamptz NOT NULL,
      status varchar(12) NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      deleted_at timestamptz
    )`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tags_updated_at ON tags(updated_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories(updated_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subtasks_updated_at ON subtasks(updated_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_reminders_updated_at ON reminders(updated_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reminders_updated_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subtasks_updated_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_updated_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tags_updated_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_updated_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS reminders`);
    await queryRunner.query(`DROP TABLE IF EXISTS subtasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
