// src/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { DatabaseModule } from '../database/database.module';
import { MemoryCacheMoudle } from 'src/cache/cache.module';


@Module({
  imports: [
    DatabaseModule,
    MemoryCacheMoudle
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule { }
