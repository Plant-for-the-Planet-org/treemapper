// src/auth/jwt.strategy.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { Auth0Config } from './auth0.config';
import { AuthService } from './auth.service';
import { UserCacheService } from 'src/cache/user-cache.service';

const EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email';
const EMAIL_VERIFIED_CLAIM = 'https://app.plant-for-the-planet.org/email_verified';
const IMPERSONATION_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private auth0Config: Auth0Config,
    private authService: AuthService,
    private userCacheService: UserCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
      }),
      audience: auth0Config.audience,
      issuer: `https://${auth0Config.domain}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    try {
      const email = payload[EMAIL_CLAIM];
      const emailVerified = payload[EMAIL_VERIFIED_CLAIM] === true || payload.email_verified === true;

      if (!email) {
        throw new UnauthorizedException('Email not found in token');
      }

      const user = await this.authService.validateUser(
        payload.sub,
        email,
        payload.name,
        emailVerified,
      );
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      const impersonation = await this.userCacheService.getImpersonation(payload.sub);
      if (impersonation) {
        if (Date.now() - impersonation.startedAt > IMPERSONATION_TTL_MS) {
          await this.userCacheService.clearImpersonation(payload.sub);
          return user;
        }
        return {
          ...impersonation.target,
          auth0Id: user.auth0Id,
          impersonated: true,
        };
      }

      return user;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${error?.message ?? error}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}