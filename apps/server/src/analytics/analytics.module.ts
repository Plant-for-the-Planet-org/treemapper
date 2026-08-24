import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DataExplorerController } from './data-explorer.controller';
import { DataExplorerService } from './data-explorer.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';


@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
  ],
  controllers: [AnalyticsController, DataExplorerController],
  providers: [AnalyticsService, DataExplorerService],
  exports: [AnalyticsService, DataExplorerService],
})
export class AnalyticsModule {}
