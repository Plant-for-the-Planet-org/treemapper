import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExternalModule } from '../external/external.module';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeyRateLimitGuard } from './guards/api-key-rate-limit.guard';

@Module({
  imports: [DatabaseModule, ExternalModule],
  controllers: [PublicApiController],
  providers: [PublicApiService, ApiKeyGuard, ApiKeyRateLimitGuard],
})
export class PublicApiModule {}
