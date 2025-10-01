import { IsArray, IsDate, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class InviteProjectMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['admin', 'contributor', 'observer'], {
    message: 'Role must be one of: admin, contributor, observer'
  })
  role: 'admin'| 'contributor' | 'observer';

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