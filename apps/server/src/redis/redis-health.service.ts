import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { CacheService } from './redis.service';

@Injectable()
export class RedisCacheHealthService extends HealthIndicator {
  constructor(private cacheService: CacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const health = await this.cacheService.getHealth();
      const stats = this.cacheService.getStats();
      
      const result = this.getStatus(key, health.status === 'healthy', {
        status: health.status,
        message: health.message,
        latency: health.latency,
        memory: health.memory,
        stats: {
          hitRatio: this.cacheService.getHitRatio(),
          ...stats,
        },
      });
      if (health.status === 'healthy') {
        return result;
      }

      throw new HealthCheckError('Redis health check failed', result);
    } catch (error) {
      throw new HealthCheckError('Redis health check failed', {
        [key]: {
          status: 'down',
          message: error.message,
        },
      });
    }
  }
}
