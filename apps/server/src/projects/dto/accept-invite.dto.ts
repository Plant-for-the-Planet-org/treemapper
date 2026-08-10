import { IsString, IsUUID } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsUUID()
  token: string;
}
