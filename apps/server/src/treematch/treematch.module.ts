import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { TreeMatchController } from './treematch.controller';
import { TreeMatchService } from './services/treematch.service';
import { TreeMatchLedgerService } from './services/treematch-ledger.service';
import { TreeMatchRulesService } from './services/treematch-rules.service';
import { TreeMatchAutomatchService } from './services/treematch-automatch.service';
import { TtcContributionsClient } from './clients/ttc-contributions.client';

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
  ],
  controllers: [TreeMatchController],
  providers: [
    TreeMatchService,
    TreeMatchLedgerService,
    TreeMatchRulesService,
    TreeMatchAutomatchService,
    TtcContributionsClient,
  ],
})
export class TreeMatchModule {}
