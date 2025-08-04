import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Config {
  constructor(private configService: ConfigService) {}

  get domain(): string {
    return this.configService.get<string>('AUTH0_DOMAIN') || '';
  }

  get audience(): string {
    return this.configService.get<string>('AUTH0_AUDIENCE') || '';
  }
}