import { IsString, IsUUID } from 'class-validator';

export class DeclineInviteDto {
  @IsString()
  @IsUUID()
  token: string;
}