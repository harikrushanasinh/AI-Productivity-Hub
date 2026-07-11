import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Standalone DataSource used by the TypeORM CLI for migrations.
 * Kept separate from the NestJS-managed connection in database.module.ts.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'aph_user',
  password: process.env.DB_PASSWORD ?? 'aph_password',
  database: process.env.DB_NAME ?? 'ai_productivity_hub',
  entities: ['src/modules/**/entities/*.entity.ts'],
  migrations: ['src/core/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
