import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';


@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                return {
                    store: 'memory', // Explicitly set memory store
                    ttl: 900, // 15 minutes
                    max: 1000, // Maximum number of items in cache
                };
            },
            inject: [ConfigService],
            isGlobal: true, // Makes cache available globally
        }),
    ],
    providers: [CacheService], // Add CacheService as a provider
    exports: [CacheService],
})
export class MemoryCacheMoudle { }