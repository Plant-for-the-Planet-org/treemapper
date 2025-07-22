import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get port(): number {
    return this.configService.get<number>('DB_PORT', 5432);
  }

  get username(): string {
    return this.configService.get<string>('DB_USERNAME', 'postgres');
  }

  get password(): string {
    return this.configService.get<string>('DB_PASSWORD', 'postgres');
  }

  get database(): string {
    return this.configService.get<string>('DB_NAME', 'postgres');
  }
}