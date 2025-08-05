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
    AnalyticsModule
    // MigrationModule,
    // NotificationModule,
    // MobileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }