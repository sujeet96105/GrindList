import { MigrationInterface, QueryRunner } from 'typeorm';

export class Recurring1700000000001 implements MigrationInterface {
  name = 'Recurring1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule varchar(10) DEFAULT 'none'`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval int`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS recurrence_end_date`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS recurrence_interval`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS recurrence_rule`);
  }
}
