import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
// import { AppCacheModule } from '../cache/cache.module'; // Import the cache module
import { R2Service } from 'src/common/services/r2.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, R2Service],
  exports: [UsersService]
})
export class UsersModule {}