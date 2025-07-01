import { IsArray, IsDate, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class InviteProjectMemberDto {
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


export class InviteProjectLinkDto {
  @IsArray()
  @IsString({ each: true })
  restriction?: string[];

  @IsString()
  expiry: string;
}