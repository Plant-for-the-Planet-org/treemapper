import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

function getDbCredentials() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);

    const isCloudDb = url.hostname.includes('rds.amazonaws.com')
    const ssl = isCloudDb ? { rejectUnauthorized: false } : false;

    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      user: url.username,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      database: url.pathname.slice(1),
      ssl,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
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