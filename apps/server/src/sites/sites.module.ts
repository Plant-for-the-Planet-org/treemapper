import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SiteService } from './sites.service';
import { SiteController } from './sites.controller';
import { TtcSyncService } from './ttc-sync.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
  ],
  controllers: [SiteController],
  providers: [SiteService, TtcSyncService],
  exports: [SiteService],
})
export class SitesModule { }
