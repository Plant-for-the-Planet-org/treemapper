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

// Reusable per-user rate limiter for AUTHENTICATED endpoints. Same shape as
// ip-rate-limit.guard.ts, but keyed on the signed-in user instead of the client
// IP, which is the only workable key here: field teams share a hotspot, so an
// IP limit on an app-open route would throttle a whole crew as one caller.
//
// Limits are per-dyno because the cache store is in-memory; put a CDN/WAF in
// front for a hard, cross-instance ceiling. Defence-in-depth, not the only
// control. Runs after JwtAuthGuard, so request.user is already resolved -- a
// request with no user is left to the auth guard to reject rather than being
// silently bucketed together with every other anonymous caller.

export interface UserRateLimitOptions {
  // Max requests allowed per user within the window.
  limit: number;
  // Window length in milliseconds.
  windowMs: number;
  // Optional name to namespace the counter (defaults to method + route).
  name?: string;
}

export const USER_RATE_LIMIT_KEY = 'user_rate_limit_options';

export const UserRateLimit = (options: UserRateLimitOptions) =>
  SetMetadata(USER_RATE_LIMIT_KEY, options);

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<UserRateLimitOptions>(
      USER_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No decorator on this route -> nothing to limit.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // Unauthenticated: not this guard's job.
    if (!userId) {
      return true;
    }

    const scope = options.name || `${request.method}:${request.routerPath || request.url}`;
    const key = `userrl:${scope}:${userId}`;
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
      // Preserve the original window: keep resetTime, only bump the count.
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
