import { Module } from '@nestjs/common';
import { ApprovalBoardController } from './approval-board.controller';
import { ApprovalBoardService } from './approval-board.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [ApprovalBoardController],
  providers: [ApprovalBoardService],
  exports: [ApprovalBoardService],
})
export class ApprovalBoardModule {}
