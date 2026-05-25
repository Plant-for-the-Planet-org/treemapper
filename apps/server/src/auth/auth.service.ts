import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserCacheService } from 'src/cache/user-cache.service';
import { ExtendedUser } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private userCacheService: UserCacheService,
  ) { }

  async validateUser(
    auth0Id: string,
    email: string,
    name: string,
    emailVerified: boolean,
  ): Promise<ExtendedUser> {
    try {
      let user = await this.usersService.findByAuth0Id(auth0Id);
      if (!user) {
        const migrationMarker = await this.userCacheService.getUserByAuthMigration(auth0Id);
        if (migrationMarker) {
          if (!emailVerified) {
            throw new UnauthorizedException('Email not verified; cannot link existing account');
          }
          user = await this.usersService.findByEmailAndUpdateAuth0Id(email, auth0Id);
        }
      }
      if (!user) {
        if (!emailVerified) {
          throw new UnauthorizedException('Email not verified');
        }
        user = await this.usersService.createFromAuth0(auth0Id, email, name);
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`User validation failed for auth0Id: ${auth0Id}`, error);
      throw new UnauthorizedException('User validation failed');
    }
  }
}