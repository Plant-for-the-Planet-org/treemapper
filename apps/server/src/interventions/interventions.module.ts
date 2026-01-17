import { Module } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { InterventionsController } from './interventions.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [DatabaseModule,ProjectsModule],
  controllers: [InterventionsController],
  providers: [InterventionsService,],
  exports: [InterventionsService],
})
export class InterventionsModule {}