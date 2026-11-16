import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { LandmarksController } from './landmarks.controller';
import { LandmarksService } from './landmarks.service';

@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [LandmarksController],
  providers: [LandmarksService],
  exports: [LandmarksService],
})
export class LandmarksModule { }
