import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { parseDatabaseConfig } from './database-url.parser';

dotenv.config();

const main = async () => {
  const dbConfig = parseDatabaseConfig();
  
  const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    ssl: dbConfig.ssl,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });
  
  console.log('Migrations completed successfully!');
  
  await pool.end();
  process.exit(0);
};

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});