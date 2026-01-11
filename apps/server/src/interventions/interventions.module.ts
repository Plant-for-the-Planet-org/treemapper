import { Module } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { InterventionsController } from './interventions.controller';
import { InterventionApprovalService } from './intervention-approval.service';
import { InterventionApprovalController } from './intervention-approval.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [InterventionsController, InterventionApprovalController],
  providers: [InterventionsService, InterventionApprovalService],
  exports: [InterventionsService, InterventionApprovalService],
})
export class InterventionsModule {}