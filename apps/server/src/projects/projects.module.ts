// src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectPermissionsGuard } from './guards/project-permissions.guard';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from 'src/notification/notification.module';
import { MemoryCacheMoudle } from 'src/cache/cache.module';

@Module({
  imports: [DatabaseModule,EmailModule, NotificationModule, MemoryCacheMoudle],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectPermissionsGuard,],
  exports: [ProjectsService],
})
export class ProjectsModule {}