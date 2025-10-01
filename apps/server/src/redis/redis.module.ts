import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { CacheService } from './redis.service';
import { RedisCacheHealthService } from './redis-health.service';
import { CacheInterceptor } from './redis-cache.interceptor';
import redisConfig from '../config/redis.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    TerminusModule,
  ],
  providers: [
    CacheService,
    RedisCacheHealthService,
    // CacheInterceptor,
  ],
  exports: [
    CacheService,
    RedisCacheHealthService,
    // CacheInterceptor,
  ],
})
export class RedisCacheModule {}