import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'aph_user',
  password: process.env.DB_PASSWORD ?? 'aph_password',
  database: process.env.DB_NAME ?? 'ai_productivity_hub',
}));
