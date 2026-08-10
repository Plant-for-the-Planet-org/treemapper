import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MemoryCacheMoudle } from 'src/cache/cache.module';
import { StartupService } from './startup.service';
import { WorkspaceModule } from 'src/workspace/workspace.module';

@Module({
  imports: [DatabaseModule,MemoryCacheMoudle, WorkspaceModule],
  controllers: [],
  providers: [StartupService],
  exports: [StartupService],
})
export class StartupModule { }
