import { URL } from 'url';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: any;
}

export function parseDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);

      const isCloudDb = url.hostname.includes('rds.amazonaws.com')
        let sslConfig: any = false;
      if (process.env.DB_SSL === 'false') {
        sslConfig = false;
      } else if (process.env.DB_SSL === 'true' || isCloudDb) {
        sslConfig = { rejectUnauthorized: false };
      }
      return {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 5432,
        username: url.username,
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
        ssl: sslConfig,
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
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}