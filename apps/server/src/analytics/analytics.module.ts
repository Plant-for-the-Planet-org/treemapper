import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsJobProcessor } from './analytics-job.processor';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    ScheduleModule.forRoot(),
    ConfigModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis'),
      }),
    }),
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsJobProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}