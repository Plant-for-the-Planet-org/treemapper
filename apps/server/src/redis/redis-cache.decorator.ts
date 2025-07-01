import { CacheOptions } from '@nestjs/cache-manager';
import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';
export const CACHE_EVICT_KEY = 'cache_evict';

export interface CacheableOptions extends CacheOptions {
  keyGenerator?: (...args: any[]) => string;
  condition?: (...args: any[]) => boolean;
}

export interface CacheEvictOptions extends CacheOptions {
  keyGenerator?: (...args: any[]) => string;
  allEntries?: boolean;
}

export const Cacheable = (options: CacheableOptions = {}) =>
  SetMetadata(CACHEABLE_KEY, options);

export const CacheEvict = (options: CacheEvictOptions = {}) =>
  SetMetadata(CACHE_EVICT_KEY, options);
