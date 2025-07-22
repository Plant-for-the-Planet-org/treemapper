import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheOptions, CacheHealthStatus, CacheStats } from './redis-cache.interface';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    // const redisConfig = this.configService.get('redis');

    // this.redis = new Redis({
    //   host: redisConfig.host,
    //   port: redisConfig.port,
    //   password: redisConfig.password,
    //   db: redisConfig.db,
    //   keyPrefix: `${redisConfig.keyPrefix}:`,
    //   maxRetriesPerRequest: 2, // Reduce from 3
    //   lazyConnect: redisConfig.lazyConnect,
    //   connectTimeout: 10000, // 10 seconds
    //   commandTimeout: 5000,  // 5 seconds
    //   // Add connection pooling
    //   family: 4,
    //   keepAlive: 0, // 0 disables TCP keep-alive, or set to a positive number (ms) if needed
    // });

    // this.redis.on('connect', () => {
    //   this.logger.log('Redis connected successfully');
    // });

    // this.redis.on('error', (error) => {
    //   this.logger.error('Redis connection error:', error);
    //   this.stats.errors++;
    // });

    // this.redis.on('ready', () => {
    //   this.logger.log('Redis ready to accept commands');
    // });

    // this.redis.on('close', () => {
    //   this.logger.warn('Redis connection closed');
    // });

    // try {
    //   await this.redis.connect();
    // } catch (error) {
    //   this.logger.error('Failed to connect to Redis:', error);
    // }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Generate cache key with UID
   */
  private generateKey(key: string, uid?: string): string {
    return uid ? `${key}:${uid}` : key;
  }

  /**
   * Get default TTL from config
   */
  private getDefaultTTL(): number {
    return this.configService.get('redis.defaultTTL', 604800);
  }

  /**
   * Serialize data for Redis storage
   */
  private serialize(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      this.logger.error('Serialization error:', error);
      throw new Error('Failed to serialize data');
    }
  }

  /**
   * Deserialize data from Redis
   */
  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Deserialization error:', error);
      throw new Error('Failed to deserialize data');
    }
  }

  /**
   * PLACEHOLDER: Custom serialization for complex objects
   * TODO: Implement your custom serialization logic here
   */
  private customSerialize(data: any): string {
    // TODO: Add your custom serialization logic for complex objects
    // Example: Handle Date objects, custom classes, etc.
    this.logger.warn('Using default serialization - implement custom logic if needed');
    return this.serialize(data);
  }

  /**
   * PLACEHOLDER: Custom deserialization for complex objects
   * TODO: Implement your custom deserialization logic here
   */
  private customDeserialize<T>(data: string): T {
    // TODO: Add your custom deserialization logic for complex objects
    // Example: Reconstruct Date objects, custom classes, etc.
    this.logger.warn('Using default deserialization - implement custom logic if needed');
    return this.deserialize<T>(data);
  }

  // ========================
  // BASIC OPERATIONS
  // ========================

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const data = await this.redis.get(cacheKey);

      if (data === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return this.customDeserialize<T>(data);
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const serializedData = this.customSerialize(value);
      const ttl = options?.ttl || this.getDefaultTTL();

      const result = await this.redis.setex(cacheKey, ttl, serializedData);
      this.stats.sets++;
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const result = await this.redis.del(cacheKey);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const result = await this.redis.exists(cacheKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const result = await this.redis.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache EXPIRE error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      this.stats.errors++;
      return -1;
    }
  }

  // ========================
  // ADVANCED OPERATIONS
  // ========================

  /**
   * Get multiple keys
   */
  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options?.uid));
      const results = await this.redis.mget(...cacheKeys);

      return results.map(result => {
        if (result === null) {
          this.stats.misses++;
          return null;
        }
        this.stats.hits++;
        return this.customDeserialize<T>(result);
      });
    } catch (error) {
      this.logger.error('Cache MGET error:', error);
      this.stats.errors++;
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValues: Record<string, any>, options?: CacheOptions): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = options?.ttl || this.getDefaultTTL();

      Object.entries(keyValues).forEach(([key, value]) => {
        const cacheKey = this.generateKey(key, options?.uid);
        const serializedData = this.customSerialize(value);
        pipeline.setex(cacheKey, ttl, serializedData);
      });

      const results = await pipeline.exec();
      this.stats.sets += Object.keys(keyValues).length;

      return results?.every(([err, result]) => err === null && result === 'OK') || false;
    } catch (error) {
      this.logger.error('Cache MSET error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async mdel(keys: string[], options?: CacheOptions): Promise<number> {
    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options?.uid));
      const result = await this.redis.del(...cacheKeys);
      this.stats.deletes += result;
      return result;
    } catch (error) {
      this.logger.error('Cache MDEL error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Increment numeric value
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const result = await this.redis.incr(cacheKey);

      // Set TTL if it's a new key
      if (result === 1) {
        const ttl = options?.ttl || this.getDefaultTTL();
        await this.redis.expire(cacheKey, ttl);
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache INCR error for key ${key}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Decrement numeric value
   */
  async decr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options?.uid);
      const result = await this.redis.decr(cacheKey);

      // Set TTL if it's a new key
      if (result === -1) {
        const ttl = options?.ttl || this.getDefaultTTL();
        await this.redis.expire(cacheKey, ttl);
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache DECR error for key ${key}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get keys by pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Cache KEYS error for pattern ${pattern}:`, error);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Flush all keys
   */
  async flushAll(): Promise<boolean> {
    try {
      const result = await this.redis.flushall();
      return result === 'OK';
    } catch (error) {
      this.logger.error('Cache FLUSHALL error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // ========================
  // HEALTH & MONITORING
  // ========================

  /**
   * Get cache health status
   */
  async getHealth(): Promise<CacheHealthStatus> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      const info = await this.redis.info('memory');
      const memoryInfo = this.parseMemoryInfo(info);

      return {
        status: 'healthy',
        message: 'Redis is healthy',
        latency,
        memory: memoryInfo,
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        message: error.message || 'Redis health check failed',
      };
    }
  }

  /**
   * Parse memory info from Redis INFO command
   */
  private parseMemoryInfo(info: string): any {
    const lines = info.split('\r\n');
    const memory = {};

    lines.forEach(line => {
      if (line.includes('used_memory_human:')) {
        memory['used'] = line.split(':')[1];
      }
      if (line.includes('used_memory_peak_human:')) {
        memory['peak'] = line.split(':')[1];
      }
      if (line.includes('mem_fragmentation_ratio:')) {
        memory['fragmentation'] = line.split(':')[1];
      }
    });

    return memory;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }
}
