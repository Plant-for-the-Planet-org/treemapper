import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './redis.service';
import {
  CACHEABLE_KEY,
  CACHE_EVICT_KEY,
  CacheableOptions,
  CacheEvictOptions,
} from './redis-cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheableOptions = this.reflector.get<CacheableOptions>(
      CACHEABLE_KEY,
      context.getHandler(),
    );

    const cacheEvictOptions = this.reflector.get<CacheEvictOptions>(
      CACHE_EVICT_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const args = [request.params, request.query, request.body].filter(Boolean);

    // Handle cache eviction
    if (cacheEvictOptions) {
      return next.handle().pipe(
        tap(async () => {
          const key = this.generateCacheKey(context, args, cacheEvictOptions);
          if (cacheEvictOptions.allEntries) {
            await this.cacheService.flushAll();
          } else {
            await this.cacheService.del(key, cacheEvictOptions);
          }
        }),
      );
    }

    // Handle caching
    if (cacheableOptions) {
      // Check condition if provided
      if (cacheableOptions.condition && !cacheableOptions.condition(...args)) {
        return next.handle();
      }

      const key = this.generateCacheKey(context, args, cacheableOptions);
      
      try {
        const cachedResult = await this.cacheService.get(key, cacheableOptions);
        if (cachedResult !== null) {
          return of(cachedResult);
        }
      } catch (error) {
        // Log error but continue to execute method
        console.error('Cache get error:', error);
      }

      return next.handle().pipe(
        tap(async (result) => {
          try {
            await this.cacheService.set(key, result, cacheableOptions);
          } catch (error) {
            // Log error but don't fail the request
            console.error('Cache set error:', error);
          }
        }),
      );
    }

    return next.handle();
  }

  private generateCacheKey(
    context: ExecutionContext,
    args: any[],
    options: CacheableOptions | CacheEvictOptions,
  ): string {
    if (options.keyGenerator) {
      return options.keyGenerator(...args);
    }

    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const argsKey = args.length > 0 ? JSON.stringify(args) : '';
    
    return `${className}:${methodName}:${argsKey}`;
  }
}