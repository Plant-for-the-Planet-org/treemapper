import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './database.config';
import { DrizzleService } from './drizzle.service';

@Module({
  imports: [ConfigModule],
  providers: [DatabaseConfig, DrizzleService],
  exports: [DrizzleService],
})
export class DatabaseModule {}