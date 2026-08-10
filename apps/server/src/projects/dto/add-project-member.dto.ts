import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class AddProjectMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['admin', 'contributor', 'observer'], {
    message: 'Role must be one of: admin, contributor, observer'
  })
  role: 'admin' | 'contributor' | 'observer';

  @IsOptional()
  @IsString()
  message?: string;
}