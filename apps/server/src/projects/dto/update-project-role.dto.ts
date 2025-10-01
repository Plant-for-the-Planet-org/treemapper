import { IsEnum } from 'class-validator';

export class UpdateProjectRoleDto {
  @IsEnum(['admin', 'contributor', 'observer'], {
    message: 'Role must be one of: admin, contributor, observer'
  })
  role: 'admin' | 'contributor' | 'observer';
}
