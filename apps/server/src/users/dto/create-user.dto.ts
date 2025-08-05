import { IsEmail, IsOptional, IsString, IsBoolean, IsEnum, IsUrl, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserType {
  INDIVIDUAL = 'individual',
  EDUCATION = 'education',
  TPO = 'tpo',
  ORGANIZATION = 'organization',
  STUDENT = 'student'
}

export class CreateUserDto {
  @IsString()
  @MaxLength(36)
  uid: string;

  @IsString()
  auth0Id: string;

  @IsEmail()
  email: string;

  @IsString()
  authName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  supportPin?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}
export class AvatarDTO {

  @IsString()
  avatarUrl: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

}

export class CreateSurvey {

  @IsOptional()
  @IsBoolean()
  skip: boolean;

  @IsOptional()
  @IsBoolean()
  complete: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName: string;

  @IsOptional()
  @IsBoolean()
  requestedDemo: boolean;

  @IsOptional()
  @IsString()
  primaryGoal: string;

  @IsOptional()
  @IsString()
  role: string;

  @IsOptional()
  @IsBoolean()
  devMode: boolean;

  @IsOptional()
  @IsBoolean()
  forestCloud: boolean;


  @IsString()
  projectName: string;

}