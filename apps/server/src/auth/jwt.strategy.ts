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

// `google-oauth2|1234` -> `google-oauth2`. Enough to tell which Auth0
// connection a failing login came through, without putting the sub itself in
// the logs.
const connectionOf = (sub: unknown): string =>
  typeof sub === 'string' && sub.includes('|') ? sub.split('|')[0] : 'unknown';

// Apple is why reading the email is not a plain property access.
//
// Our Auth0 Action puts the address under EMAIL_CLAIM, but the token can also
// carry a standard `email` claim, and the two do not always both arrive. Read
// the namespaced one first, fall back to the standard one, and require a
// non-empty string either way so a blank claim counts as absent.
const readEmailClaim = (payload: any): string | undefined => {
  for (const value of [payload?.[EMAIL_CLAIM], payload?.email]) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
};

// Apple sends `email_verified` as the *string* "true", not a boolean. A strict
// `=== true` check therefore reads a genuinely verified Apple login as
// unverified, and `validateUser` rejects it with "Email not verified" -- a hard
// lockout for a user who did nothing wrong. Accept both shapes.
//
// Only `true` and "true" count. Anything else, including the string "false",
// stays unverified, so this still fails closed. Widening the accepted shape
// costs nothing in safety: the claim arrives inside a token whose RS256
// signature we already verified against Auth0's JWKS, so its value was never
// the caller's to choose.
const isVerifiedClaim = (value: unknown): boolean => value === true || value === 'true';

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
      const email = readEmailClaim(payload);
      const emailVerified =
        isVerifiedClaim(payload?.[EMAIL_VERIFIED_CLAIM]) || isVerifiedClaim(payload?.email_verified);

      if (!email) {
        // Without an address nothing downstream can identify this user, and the
        // cause is always in the tenant, not here: either the Action that adds
        // EMAIL_CLAIM does not run for this connection, or Apple never gave us
        // an address to store. Name the connection and list the claim keys we
        // did get, so the log says which of the two it was. Keys only -- the
        // payload holds personal data.
        this.logger.error(
          `No email claim on token from connection "${connectionOf(payload?.sub)}". ` +
          `Claims present: ${Object.keys(payload ?? {}).join(', ')}. ` +
          `Check that the Auth0 Action adding ${EMAIL_CLAIM} runs for this connection.`,
        );
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Email not found in token',
          code: 'email_missing',
        });
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
      // The connection name turns "some users cannot log in" into a one-line
      // answer: if every failure here says `apple`, the problem is that
      // connection, not the login path.
      this.logger.warn(
        `JWT validation failed for connection "${connectionOf(payload?.sub)}": ${error?.message ?? error}`,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
