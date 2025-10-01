import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AnalyticsRateLimitGuard implements CanActivate {
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {
    // Clean up rate limit map every hour
    setInterval(() => this.cleanupRateLimit(), 60 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const projectId = request.params.projectId;
    const userId = request.user?.id;

    if (!projectId || !userId) {
      return true; // Let other guards handle validation
    }

    const key = `${projectId}_${userId}`;
    this.checkRateLimit(key);
    this.updateRateLimit(key);

    return true;
  }

  private checkRateLimit(key: string): void {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    
    const record = this.rateLimitMap.get(key);
    
    if (!record) {
      return; // No previous attempts
    }
    
    if (now > record.resetTime) {
      this.rateLimitMap.delete(key);
      return; // Reset time has passed
    }
    
    if (record.count >= 2) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        {
          message: `Rate limit exceeded. Analytics can only be refreshed 2 times per hour per project.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private updateRateLimit(key: string): void {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    
    const record = this.rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + hourInMs,
      });
    } else {
      record.count += 1;
    }
  }

  private cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, record] of this.rateLimitMap.entries()) {
      if (now > record.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }
}