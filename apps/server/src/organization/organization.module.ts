// src/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { OrganizationsService } from './organization.service';
import { OrganizationsController } from './organization.controller';
import { ProjectsModule } from '../projects/projects.module'; // Add this import
import { DatabaseModule } from '../database/database.module';


@Module({
  imports: [
    DatabaseModule,
    ProjectsModule
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule { }
