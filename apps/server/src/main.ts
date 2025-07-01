// src/main.ts
import { NestFactory } from '@nestjs/core';
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
        bodyLimit: 10485760, // 10MB
        caseSensitive: false,
        ignoreTrailingSlash: true,
      })
    );
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });


    app.enableCors({
      origin: process.env.NODE_ENV === 'production'
        ? ['https://treemapper-dashboard-1944c398f284.herokuapp.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
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

    // TODO: Add JWT guard when auth is implemented
    app.useGlobalGuards(app.get(JwtAuthGuard));

    // Swagger setup (development only)
    if (process.env.NODE_ENV !== 'production') {
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

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');

    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://treemapper-backend-abb922f4cbd0.herokuapp.com'
      : `http://localhost:${port}`;

    logger.log(`🚀 Application running on: ${baseUrl}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`📚 API Documentation: ${baseUrl}/api/docs`);
    }
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  } catch (error) {
    logger.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();