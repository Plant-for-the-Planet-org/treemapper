import { Module } from '@nestjs/common';

// Services
import { SpeciesRequestService } from './services/species-request.service';
import { ScientificSpeciesService } from './services/scientific-species.service';
import { ProjectSpeciesService } from './services/project-species.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module'; // Add this import
import { AuthModule } from '../auth/auth.module';

// Controllers
import { SpeciesRequestController } from './controller/species-request.controller';
import { ScientificSpeciesController } from './controller/scientific-species.controller';
import { ProjectSpeciesController } from './controller/project-species.controller';

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    AuthModule,
  ],
  controllers: [
    SpeciesRequestController,
    ScientificSpeciesController,
    ProjectSpeciesController,
  ],
  providers: [
    SpeciesRequestService,
    ScientificSpeciesService,
    ProjectSpeciesService,
  ],
  exports: [
    SpeciesRequestService,
    ScientificSpeciesService,
    ProjectSpeciesService,
  ],
})
export class SpeciesModule {}