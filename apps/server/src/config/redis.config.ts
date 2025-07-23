import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  // Check if REDIS_URL is provided (DSN format)
  // Example REDIS_URL format: redis://username:password@host:port/db
  // or with SSL: rediss://username:password@host:port/db
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        username: url.username || undefined,
        db: parseInt(url.pathname.slice(1)) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'forest-app:',
        ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '', 10) || 3600, // 1 hour default
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        // Connection pool settings
        family: 4,
        keepAlive: true,
        // Cluster settings (if using Redis Cluster)
        enableOfflineQueue: false,
        // Enable TLS if using rediss:// protocol
        tls: url.protocol === 'rediss:' ? {} : undefined,
      };
    } catch (error) {
      console.error('Invalid REDIS_URL format, falling back to individual variables:', error);
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '', 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'forest-app:',
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '', 10) || 3600, // 1 hour default
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
    // Connection pool settings
    family: 4,
    keepAlive: true,
    // Cluster settings (if using Redis Cluster)
    enableOfflineQueue: false,
  };
});