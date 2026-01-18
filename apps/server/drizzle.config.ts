import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

// Parse DATABASE_URL if available
function getDbCredentials() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      ssl: 'require' as const,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    ssl: false as const,
  };
}

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: getDbCredentials(),
} satisfies Config;