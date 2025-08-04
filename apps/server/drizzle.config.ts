import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql', // This is the required parameter now, instead of 'driver: pg'
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 6543,
    user: process.env.DB_USERNAME || 'postgres.famrkomiqrclihrrzcfu',
    password: process.env.DB_PASSWORD || '[YOUR-PASSWORD]',
    database: process.env.DB_NAME || 'postgres',
    ssl: false,
  },
} satisfies Config;