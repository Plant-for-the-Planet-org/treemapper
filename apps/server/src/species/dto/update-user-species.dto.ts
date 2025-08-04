import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserSpeciesDto } from './create-user-species.dto';

export class UpdateUserSpeciesDto extends PartialType(
  OmitType(CreateUserSpeciesDto, ['speciesId'] as const)
) {}