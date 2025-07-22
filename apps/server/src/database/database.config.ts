import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { parseDatabaseConfig } from './database-url.parser';

@Injectable()
export class DatabaseConfig {
  private readonly config = parseDatabaseConfig();

  constructor(private configService: ConfigService) {}

  get host(): string {
    return this.config.host;
  }

  get port(): number {
    return this.config.port;
  }

  get username(): string {
    return this.config.username;
  }

  get password(): string {
    return this.config.password;
  }

  get database(): string {
    return this.config.database;
  }

  get ssl(): boolean {
    return this.config.ssl || false;
  }
}