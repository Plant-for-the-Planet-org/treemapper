import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['uid', 'auth0Id', 'email'] as const)
) {
  lastLoginAt?: Date;
  isActive?: boolean;
  migratedAt?: Date;
}
