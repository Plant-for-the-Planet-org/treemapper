import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '', 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'nestjs',
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '', 10) || 604800, // 1 week in seconds
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
}));