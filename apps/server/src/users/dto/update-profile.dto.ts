import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/**
 * Self-service profile update (PATCH /users/me).
 *
 * Only fields a user is allowed to change on their own account belong here.
 * Privilege-bearing or identity columns -- notably `type` (which gates
 * SuperAdminGuard), plus `email`, `uid`, `auth0Id`, `slug`, `isActive` -- are
 * intentionally excluded. The global ValidationPipe runs with
 * `forbidNonWhitelisted: true`, so any attempt to send one of those fields is
 * rejected instead of silently ignored.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  bio?: string;

  // Frontend sends `url`; the service maps it to the `website` column and
  // treats an empty string as "clear the field".
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}
