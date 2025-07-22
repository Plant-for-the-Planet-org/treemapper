import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';
import { parseDatabaseConfig } from './src/database/database-url.parser';

dotenv.config();

const dbConfig = parseDatabaseConfig();

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    ssl: dbConfig.ssl || false,
  },
} satisfies Config;