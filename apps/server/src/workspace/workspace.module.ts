// src/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspacePermissionsGuard } from './workspace-permissions.guard';
import { DatabaseModule } from '../database/database.module';
import { MemoryCacheMoudle } from 'src/cache/cache.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [
    DatabaseModule,
    MemoryCacheMoudle,
    ProjectsModule,
    AuthModule,
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspacePermissionsGuard],
  exports: [WorkspaceService, WorkspacePermissionsGuard],
})
export class WorkspaceModule { }
