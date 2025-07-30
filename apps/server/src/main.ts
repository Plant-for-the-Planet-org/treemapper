// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

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

    app.getHttpAdapter().getInstance().addHook('onRequest', async (request, reply) => {
      logger.log(`${request.method} ${request.url}`);
    });

    const isProduction = process.env.NODE_ENV === 'production';

    // Environment-based CORS configuration
    const corsOrigins = isProduction
      ? process.env.CORS_ORIGINS?.split(',') || [`https://${process.env.HEROKU_APP_NAME}.herokuapp.com`]
      : ['http://127.0.0.1:3000', 'http://localhost:3000']; 

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

    // Swagger setup (development only)
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