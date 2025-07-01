import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class AddProjectMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['admin', 'manager', 'contributor', 'observer', 'researcher'], {
    message: 'Role must be one of: admin, manager, contributor, observer, researcher'
  })
  role: 'admin' | 'manager' | 'contributor' | 'observer' | 'researcher';

  @IsOptional()
  @IsString()
  message?: string;
}