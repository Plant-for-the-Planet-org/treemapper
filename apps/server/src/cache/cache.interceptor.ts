import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = `http:${url}`;
    const cachedResponse = await this.cacheService.get(cacheKey);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(cacheKey, response, 300); // 5 minutes
      }),
    );
  }
}