import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { R2Service } from 'src/common/services/r2.service';
import { MemoryCacheMoudle } from 'src/cache/cache.module';
import { UserRateLimitGuard } from 'src/common/guards/user-rate-limit.guard';

@Module({
  imports: [DatabaseModule, MemoryCacheMoudle],
  controllers: [UsersController],
  providers: [UsersService, R2Service, UserRateLimitGuard],
  exports: [UsersService]
})
export class UsersModule {}