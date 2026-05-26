import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { Auth0Config } from './auth0.config';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { ImpersonationGuard } from './impersonation.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    ConfigModule,
    UsersModule,
    DatabaseModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    Auth0Config,
    JwtAuthGuard,
    SuperAdminGuard,
    ImpersonationGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    SuperAdminGuard,
    ImpersonationGuard,
  ],
})
export class AuthModule {}