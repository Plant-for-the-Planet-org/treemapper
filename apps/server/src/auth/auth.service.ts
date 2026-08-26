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

      // No row carries this sub. Three kinds of user land here:
      //
      //   - brand new, with no row at all;
      //   - migrated, their row still holding the `email:<email>` placeholder;
      //   - already a user, but signing in through a different Auth0 connection
      //     than before. The login screen offers Google, Facebook and Apple next
      //     to email and password, and Auth0 mints a separate sub per
      //     connection, so the same person arrives as `google-oauth2|...` one
      //     day and `auth0|...` the next.
      //
      // The sub cannot tell these apart. The verified email can, and it is what
      // makes claiming the row safe: whoever proves control of the address owns
      // the account. An unverified login never reaches any data.
      if (!emailVerified) {
        // `code` is the stable part for clients to match on, so the dashboard can
        // show a "verify your email" screen instead of a generic failure. Matching
        // on the message text instead would break the moment the wording changes.
        // HttpExceptionFilter passes `code` through to the response body.
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Email not verified',
          code: 'email_not_verified',
        });
      }

      const link = await this.usersService.linkAuth0IdByEmail(email, auth0Id);
      if (link.status === 'linked') {
        return link.user;
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