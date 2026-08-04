import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { PushModule } from '../notification/push/push.module';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

// ProjectsModule provides ProjectsService + ProjectPermissionsGuard, which the
// controller's ProjectPermissionsGuard depends on (same wiring as SitesModule).
// PushModule provides OneSignal delivery. AuditService comes from AuditModule,
// which is @Global, so it needs no import here.
@Module({
  imports: [DatabaseModule, ProjectsModule, PushModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
