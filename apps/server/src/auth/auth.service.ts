import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ExtendedUser } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
  ) { }

  async validateUser(
    auth0Id: string,
    email: string,
    name: string,
    emailVerified: boolean,
  ): Promise<ExtendedUser> {
    try {
      // Reads the cache, then the database. Covers every user who already has a
      // real Auth0 sub on their row.
      const existing = await this.usersService.findByAuth0Id(auth0Id);
      if (existing) {
        return existing;
      }

      // No row carries this sub. Either the user is brand new, or they were
      // migrated and their row still holds the `email:<email>` placeholder the
      // migration wrote. Both cases need a verified email before we touch data.
      if (!emailVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      const link = await this.usersService.linkAuth0IdByEmail(email, auth0Id);
      if (link.status === 'linked') {
        return link.user;
      }
      if (link.status === 'conflict') {
        // Same email, different Auth0 identity (for example a social login on top
        // of a password account). Re-pointing the row would hand this identity
        // someone else's data, so refuse and let support merge the accounts.
        this.logger.error(
          `Cannot link auth0Id ${auth0Id}: email already owned by ${link.existingAuth0Id}`,
        );
        throw new UnauthorizedException(
          'This email is already linked to another login method. Please contact support.',
        );
      }
      return await this.usersService.createFromAuth0(auth0Id, email, name);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`User validation failed for auth0Id: ${auth0Id}`, error);
      throw new UnauthorizedException('User validation failed');
    }
  }
}