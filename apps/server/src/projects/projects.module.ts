// src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectApiKeyController } from './project-api-key.controller';
import { ProjectApiKeyService } from './project-api-key.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectPermissionsGuard } from './guards/project-permissions.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from 'src/notification/notification.module';
import { MemoryCacheMoudle } from 'src/cache/cache.module';

@Module({
  imports: [DatabaseModule,EmailModule, NotificationModule, MemoryCacheMoudle],
  controllers: [ProjectsController, ProjectApiKeyController],
  providers: [ProjectsService, ProjectApiKeyService, ProjectPermissionsGuard, SuperAdminGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}