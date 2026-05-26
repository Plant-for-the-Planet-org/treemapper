import { IsArray, IsIn } from 'class-validator';
import { PROJECT_PERMISSIONS, ProjectPermission } from 'src/database/schema';

export class UpdateExtraPermissionsDto {
  @IsArray()
  @IsIn(PROJECT_PERMISSIONS, { each: true, message: `Each permission must be one of: ${PROJECT_PERMISSIONS.join(', ')}` })
  extraPermissions: ProjectPermission[];
}
