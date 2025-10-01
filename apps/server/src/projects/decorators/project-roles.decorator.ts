// src/projects/decorators/project-roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export type ProjectRole = 'owner' | 'admin' | 'contributor' | 'observer';

export const ProjectRoles = (...roles: ProjectRole[]) => SetMetadata('projectRoles', roles);