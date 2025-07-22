import { Module } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { InterventionsController } from './interventions.controller';
import { TreesModule } from '../trees/trees.module';
import { TreesController } from '../trees/trees.controller';
import { DatabaseModule } from '../database/database.module'; // Adjust import path
import { ProjectsModule } from '../projects/projects.module'; // Add this import

@Module({
  imports: [DatabaseModule,ProjectsModule, TreesModule],
  controllers: [InterventionsController],
  providers: [InterventionsService,],
  exports: [InterventionsService],
})
export class InterventionsModule {}