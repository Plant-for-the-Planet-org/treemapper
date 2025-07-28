import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DatabaseConfig } from './database.config';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private _pool: Pool;
  private _db: ReturnType<typeof drizzle>;

  constructor(private readonly dbConfig: DatabaseConfig) {}

  async onModuleInit() {
    this._pool = new Pool({
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      user: this.dbConfig.username,
      password: this.dbConfig.password,
      database: this.dbConfig.database,
      ssl:this.dbConfig.ssl
    });

    this._db = drizzle(this._pool, { schema });
  }

  async onModuleDestroy() {
    await this._pool.end();
  }

  get db(): ReturnType<typeof drizzle> {
    return this._db;
  }
}