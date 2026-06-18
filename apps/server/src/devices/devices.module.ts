import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

// ProjectsModule provides ProjectsService + ProjectPermissionsGuard, which the
// controller's ProjectPermissionsGuard depends on (same wiring as SitesModule).
@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
