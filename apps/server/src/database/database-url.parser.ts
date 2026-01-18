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

      // Check if this is a Supabase connection (or other cloud DB requiring SSL)
      const isSupabase = url.hostname.includes('supabase.co');
      const isCloudDb = isSupabase || url.hostname.includes('rds.amazonaws.com') || url.hostname.includes('neon.tech');

      // Determine SSL configuration
      let sslConfig: any = false;
      if (process.env.DB_SSL === 'false') {
        sslConfig = false;
      } else if (isCloudDb || process.env.DB_SSL !== 'false') {
        // For Supabase and cloud databases, we need SSL with rejectUnauthorized: false
        sslConfig = { rejectUnauthorized: false };
      }

      return {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 5432,
        username: url.username,
        password: decodeURIComponent(url.password), // Decode password in case it has special chars
        database: url.pathname.slice(1), // Remove leading slash
        ssl: sslConfig
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
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}