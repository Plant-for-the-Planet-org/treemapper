import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { RedisCacheHealthService } from './redis/redis-health.service';

@Controller()

export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisCacheHealthService: RedisCacheHealthService
  ) { }

  @Get('/health')
  @Public()
  getHello(): Object {
    return this.appService.getHealth();
  }

  @Public()
  @Get('health/cache')
  async getCacheHealth() {
    return this.redisCacheHealthService.isHealthy("test");
  }
}
