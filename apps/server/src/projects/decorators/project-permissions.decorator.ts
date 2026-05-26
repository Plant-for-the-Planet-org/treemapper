import { SetMetadata } from '@nestjs/common';
import { ProjectPermission } from 'src/database/schema';

export const PROJECT_PERMISSIONS_KEY = 'projectPermissions';
export const ProjectPermissions = (...perms: ProjectPermission[]) =>
  SetMetadata(PROJECT_PERMISSIONS_KEY, perms);
