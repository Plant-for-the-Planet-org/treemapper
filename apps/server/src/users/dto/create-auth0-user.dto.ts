import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateAuth0UserDto {
  @IsString()
  auth0Id: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
