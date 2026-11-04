import { NestExpressApplication } from '@nestjs/platform-express';
import { merchantLogoDirectory, merchantLogoPath } from './merchants/merchant-logo';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // CORS configuration for web clients, kiosks, and display tablets
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useStaticAssets(merchantLogoDirectory, { prefix: merchantLogoPath, index: false });

  // REST API version prefix
  app.setGlobalPrefix('api/v1');

  // Global exception filter and response envelope
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Strict DTO validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MobiOs Spin & Win Exhibition API')
    .setDescription(
      'Authoritative backend API for the MobiOs Spin & Win event application at INFOTEL. Features dynamic rolling pacing, strict priority curves, atomic MySQL InnoDB locking, rotating QR claims, and real-time Socket.IO subscriptions.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Admin JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-display-token',
        in: 'header',
        description:
          'Display Screen Shared Secret Token for Kiosks and QR Tablets',
      },
      'x-display-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(
    `MobiOs Spin & Win backend listening on port ${port} (API: /api/v1, Docs: /api/docs)`,
  );
}

void bootstrap();
