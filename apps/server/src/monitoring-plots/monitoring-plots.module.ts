import { Module } from '@nestjs/common';
import { MonitoringPlotsController } from './monitoring-plots.controller';
import { MonitoringPlotsService } from './monitoring-plots.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [MonitoringPlotsController],
  providers: [MonitoringPlotsService],
  exports: [MonitoringPlotsService],
})
export class MonitoringPlotsModule {}
