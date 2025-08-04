import { URL } from 'url';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: any;
}

/**
 * Parse DATABASE_URL or fall back to individual environment variables
 * Supports PostgreSQL URLs like: postgresql://user:password@host:port/database
 */
export function parseDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);

      return {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        ssl: process.env.DB_SSL ? true : process.env.DB_SSL_BYPASS ? { rejectUnauthorized: false } : false
      };
    } catch (error) {
      console.warn('Failed to parse DATABASE_URL, falling back to individual env vars:', error.message);
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    ssl: process.env.DB_SSL === 'true'
  };
}