import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';

const HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 2;
const cacheKey = (projectId: string, userId: number) => `analytics:ratelimit:${projectId}:${userId}`;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class AnalyticsRateLimitGuard implements CanActivate {
  constructor(private cacheService: CacheService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId = request.params.projectId;
    const userId = request.user?.id;

    if (!projectId || !userId) {
      return true;
    }

    const key = cacheKey(projectId, userId);
    const now = Date.now();
    const existing = await this.cacheService.get<RateLimitEntry>(key);

    if (existing && now < existing.resetTime) {
      if (existing.count >= MAX_REQUESTS_PER_HOUR) {
        const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
        throw new HttpException(
          {
            message: `Rate limit exceeded. Analytics can only be refreshed ${MAX_REQUESTS_PER_HOUR} times per hour per project.`,
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      const remainingTtl = existing.resetTime - now;
      await this.cacheService.set<RateLimitEntry>(
        key,
        { count: existing.count + 1, resetTime: existing.resetTime },
        remainingTtl,
      );
    } else {
      await this.cacheService.set<RateLimitEntry>(
        key,
        { count: 1, resetTime: now + HOUR_MS },
        HOUR_MS,
      );
    }

    return true;
  }
}