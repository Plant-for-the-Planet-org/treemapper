import { Module } from '@nestjs/common';
import { ApprovalBoardController } from './approval-board.controller';
import { ApprovalBoardService } from './approval-board.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, ProjectsModule, WorkspaceModule, AuthModule],
  controllers: [ApprovalBoardController],
  providers: [ApprovalBoardService],
  exports: [ApprovalBoardService],
})
export class ApprovalBoardModule {}
