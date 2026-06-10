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

// Reusable per-IP rate limiter for PUBLIC (unauthenticated) endpoints. Mirrors
// the pattern in analytics/guards/analytics-rate-limit.guard.ts and reuses the
// shared CacheService (no new dependency). Limits are per-dyno because the cache
// store is in-memory; put a CDN/WAF (e.g. Cloudflare) in front for a hard,
// cross-instance ceiling. This guard is defence-in-depth, not the only control.

export interface IpRateLimitOptions {
  // Max requests allowed per IP within the window.
  limit: number;
  // Window length in milliseconds.
  windowMs: number;
  // Optional name to namespace the counter (defaults to method + route).
  name?: string;
}

export const IP_RATE_LIMIT_KEY = 'ip_rate_limit_options';

export const IpRateLimit = (options: IpRateLimitOptions) =>
  SetMetadata(IP_RATE_LIMIT_KEY, options);

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class IpRateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<IpRateLimitOptions>(
      IP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No decorator on this route -> nothing to limit.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const ip = this.resolveIp(request);
    const scope = options.name || `${request.method}:${request.routerPath || request.url}`;
    const key = `iprl:${scope}:${ip}`;
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

  // Resolve the real client IP. Behind Cloudflare, cf-connecting-ip is set by
  // the edge and cannot be spoofed by the client. Behind Heroku (or any proxy),
  // fall back to the first x-forwarded-for entry, then the socket address.
  private resolveIp(request: any): string {
    const cf = request.headers?.['cf-connecting-ip'];
    if (cf) {
      return Array.isArray(cf) ? cf[0] : cf;
    }
    const xff = request.headers?.['x-forwarded-for'];
    if (xff) {
      const first = (Array.isArray(xff) ? xff[0] : xff).split(',')[0].trim();
      if (first) {
        return first;
      }
    }
    return request.ip || 'unknown';
  }
}
