import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from 'src/cache/cache.service';

// Per-API-key rate limiter for the v1/public surface. Must run after
// ApiKeyGuard, which resolves and populates request.apiProject: keying on the
// project (not the caller IP) is deliberate, since a valid integration is a
// server calling on behalf of one project and may share an IP with others.
// Mirrors common/guards/ip-rate-limit.guard.ts.

export interface ApiKeyRateLimitOptions {
  limit: number;
  windowMs: number;
  name?: string;
}

export const API_KEY_RATE_LIMIT_KEY = 'api_key_rate_limit_options';

export const ApiKeyRateLimit = (options: ApiKeyRateLimitOptions) =>
  SetMetadata(API_KEY_RATE_LIMIT_KEY, options);

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ApiKeyRateLimitOptions>(
      API_KEY_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const projectId = request.apiProject?.id;

    // ApiKeyGuard runs first and rejects an invalid/missing key before this
    // guard is reached, so a missing projectId here means nothing to key on.
    if (!projectId) {
      return true;
    }

    const scope = options.name || `${request.method}:${request.routerPath || request.url}`;
    const key = `apirl:${scope}:${projectId}`;
    const now = Date.now();
    const existing = await this.cacheService.get<RateLimitEntry>(key);

    if (existing && now < existing.resetTime) {
      if (existing.count >= options.limit) {
        const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
        throw new HttpException(
          {
            message: 'Too many requests. Please slow down and try again later.',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      await this.cacheService.set<RateLimitEntry>(
        key,
        { count: existing.count + 1, resetTime: existing.resetTime },
        existing.resetTime - now,
      );
    } else {
      await this.cacheService.set<RateLimitEntry>(
        key,
        { count: 1, resetTime: now + options.windowMs },
        options.windowMs,
      );
    }

    return true;
  }
}
