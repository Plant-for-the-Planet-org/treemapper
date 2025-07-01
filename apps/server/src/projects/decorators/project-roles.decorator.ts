// src/projects/decorators/project-roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export type ProjectRole = 'owner' | 'admin' | 'manager' | 'contributor' | 'observer' | 'researcher';

export const ProjectRoles = (...roles: ProjectRole[]) => SetMetadata('projectRoles', roles);