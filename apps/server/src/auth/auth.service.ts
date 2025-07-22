// src/auth/auth.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
  ) { }

  // Verify user exists and create if not
async validateUser(auth0Id: string, email: string, name: string): Promise<User> {
  try {
    let user = await this.usersService.findByAuth0Id(auth0Id);
    if (!user) {
      user = await this.usersService.createFromAuth0(
        auth0Id,
        email,
        name
      );
    }
    return user;
  } catch (error) {
    this.logger.error(`User validation failed for auth0Id: ${auth0Id}`, error);
    throw new UnauthorizedException('User validation failed');
  }
}
}