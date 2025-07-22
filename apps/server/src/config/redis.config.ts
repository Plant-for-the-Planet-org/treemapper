import { registerAs } from '@nestjs/config';


export default registerAs('redis', () => ({
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
}));