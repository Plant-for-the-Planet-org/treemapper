import { IsEnum } from 'class-validator';

export class UpdateProjectRoleDto {
  @IsEnum(['admin', 'manager', 'contributor', 'observer', 'researcher'], {
    message: 'Role must be one of: admin, manager, contributor, observer, researcher'
  })
  role: 'admin' | 'contributor' | 'observer';
}
