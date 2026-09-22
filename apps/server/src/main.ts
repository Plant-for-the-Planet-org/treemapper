// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { StartupService } from './startup/startup.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: false,
        bodyLimit: 10485760,
        caseSensitive: false,
        ignoreTrailingSlash: true,
      })
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const originVerifySecret = process.env.CLOUDFLARE_ORIGIN_SECRET;

    // Reject requests that did not pass through Cloudflare. Without this, the
    // Heroku dyno's own *.herokuapp.com address is reachable directly, so a
    // bot can skip Cloudflare entirely and forge cf-connecting-ip on every
    // request -- which is what IpRateLimitGuard trusts for rate limiting.
    // Cloudflare is set up (via a Transform Rule) to stamp every request it
    // forwards with this header; only Cloudflare knows the value, so its
    // absence or mismatch means the request bypassed Cloudflare.
    // Fails open (does not block) if the secret isn't configured yet, so a
    // deploy can land before the matching Cloudflare rule and Heroku config
    // var are both in place -- see CLAUDE.md for the rollout steps.
    if (isProduction) {
      if (!originVerifySecret) {
        logger.warn(
          '⚠️  CLOUDFLARE_ORIGIN_SECRET is not set -- direct-to-Heroku requests are not being blocked. Set it once the matching Cloudflare Transform Rule is in place.',
        );
      } else {
        app.getHttpAdapter().getInstance().addHook('onRequest', async (request, reply) => {
          if (request.headers['x-origin-verify'] !== originVerifySecret) {
            logger.warn(`Blocked direct-origin request (missing/invalid x-origin-verify): ${request.method} ${request.url}`);
            reply.code(403).send({ message: 'Forbidden' });
          }
        });
      }
    }

    app.getHttpAdapter().getInstance().addHook('onRequest', async (request, reply) => {
      logger.log(`${request.method} ${request.url}`);
    });

    // Open CORS for the public external API. These routes are @Public() and
    // read-only, so any origin may call them from a browser. No credentials
    // are used here, which is what lets us safely return a wildcard origin --
    // separate from the strict, credentialed policy below used for auth routes.
    app.getHttpAdapter().getInstance().addHook('onRequest', async (request, reply) => {
      if (request.url.startsWith('/api/external/')) {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        reply.header(
          'Access-Control-Allow-Headers',
          request.headers['access-control-request-headers'] || 'Content-Type, Accept',
        );
        reply.header('Access-Control-Max-Age', '86400');
        if (request.method === 'OPTIONS') {
          reply.code(204).send();
        }
      }
    });

    // Environment-based CORS configuration
    const corsOrigins = isProduction
      ? process.env.CORS_ORIGINS?.split(',') || [`https://${process.env.HEROKU_APP_NAME}.herokuapp.com`]
      : ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://localhost:3004'];

    await app.register(compression, { global: true });

    // Security headers. CSP is disabled outside production because Swagger UI
    // (mounted below, dev-only) needs inline scripts/styles to render; the
    // rest of helmet's defaults (X-Content-Type-Options, X-Frame-Options,
    // HSTS, etc.) still apply everywhere. In production Swagger is off, so
    // the full default CSP applies.
    await app.register(helmet, {
      contentSecurityPolicy: isProduction ? undefined : false,
    });

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Global JWT guard with Reflector for handling @Public() decorator
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    // Swagger setup (development only). Never exposed in production: it would
    // hand any visitor a full map of the API surface.
    if (!isProduction) {
      const config = new DocumentBuilder()
        .setTitle('TreeMapper API')
        .setDescription('The TreeMapper Backend API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      logger.log('📚 Swagger documentation available at /api/docs');
    }

    // Environment-based port configuration
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');

    // Environment-based base URL
    const baseUrl = isProduction
      ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`
      : `http://localhost:${port}`;

    logger.log(`🚀 Server running on port: ${port}`);
    logger.log(`🌐 Base URL: ${baseUrl}`);
    logger.log(`🔒 All routes protected by JWT authentication`);
    logger.log(`🌐 CORS origins: ${corsOrigins.join(', ')}`);


    if (!isProduction) {
      logger.log(`📚 API Documentation: ${baseUrl}/api/docs`);
    }
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  } catch (error) {
    logger.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();