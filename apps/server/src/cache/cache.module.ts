import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { UserCacheService } from './user-cache.service';
import { ProjectCacheService } from './project-cache.service';


@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async () => ({
                store: 'memory'
            }),
            inject: [ConfigService],
            isGlobal: true,
        }),
    ],
    providers: [CacheService, UserCacheService, ProjectCacheService],
    exports: [CacheService, CacheModule, UserCacheService, ProjectCacheService],
})
export class MemoryCacheMoudle { }