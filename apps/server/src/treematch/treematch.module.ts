import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { TreeMatchController } from './treematch.controller';
import { TreeMatchService } from './treematch.service';
import { TtcContributionsClient } from './ttc-contributions.client';
import { TreeMatchRulesService } from './automatch/treematch-rules.service';
import { TreeMatchAutomatchService } from './automatch/treematch-automatch.service';

@Module({
  imports: [
    DatabaseModule,
    // ProjectPermissionsGuard depends on it.
    ProjectsModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
  ],
  controllers: [TreeMatchController],
  providers: [
    TreeMatchService,
    TtcContributionsClient,
    TreeMatchRulesService,
    TreeMatchAutomatchService,
  ],
})
export class TreeMatchModule {}
