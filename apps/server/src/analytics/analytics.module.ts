import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsJobProcessor } from './analytics-job.processor';
import { HistoricalSnapshotService } from './historical-snapshot.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module'; // Add this import


@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsJobProcessor, HistoricalSnapshotService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}