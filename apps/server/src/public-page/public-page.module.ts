import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { IpRateLimitGuard } from '../common/guards/ip-rate-limit.guard';
import { PublicPageController } from './public-page.controller';
import { PublicPageSettingsController } from './public-page-settings.controller';
import { PublicPageService } from './public-page.service';

@Module({
  // ProjectsModule supplies ProjectPermissionsGuard's dependencies, which the
  // settings controller needs. The public read endpoint needs neither.
  imports: [DatabaseModule, ProjectsModule],
  controllers: [PublicPageController, PublicPageSettingsController],
  providers: [PublicPageService, IpRateLimitGuard],
  exports: [PublicPageService],
})
export class PublicPageModule {}
