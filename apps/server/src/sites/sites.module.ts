import { Module } from '@nestjs/common';
import { SiteService } from './sites.service';
import { SiteController } from './sites.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [DatabaseModule,ProjectsModule],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SitesModule { }
