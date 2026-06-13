import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MemoryCacheMoudle } from './cache/cache.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { StartupModule } from './startup/startup.module';
import { ProjectsModule } from './projects/projects.module';
import { SitesModule } from './sites/sites.module';
import { InterventionsModule } from './interventions/interventions.module';
import { SpeciesModule } from './species/species.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MobileModule } from './mobile/mobile.module';
import { NotificationModule } from './notification/notification.module';
import { AuditModule } from './audit/audit.module';
import { MigrationModule } from './migrate/migrate.module.ts';
import { ContactSupportModule } from './contact-support/contact-support.module';
import { ApprovalBoardModule } from './approval-board/approval-board.module';
import { ExternalModule } from './external/external.module';
import { PublicApiModule } from './public-api/public-api.module';
import { MonitoringPlotsModule } from './monitoring-plots/monitoring-plots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MemoryCacheMoudle,
    WorkspaceModule,
    StartupModule,
    ProjectsModule,
    SitesModule,
    InterventionsModule,
    SpeciesModule,
    AnalyticsModule,
    MobileModule,
    NotificationModule,
    AuditModule,
    MigrationModule,
    ContactSupportModule,
    ApprovalBoardModule,
    ExternalModule,
    PublicApiModule,
    MonitoringPlotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }