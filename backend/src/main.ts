// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');


  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Register the filter globally
  app.useGlobalFilters(new HttpExceptionFilter());


  if (process.env.NODE_ENV === 'production') {
    // Use the underlying Express instance to register static file serving
    // and a catch-all route for client-side routing. Static middleware must
    // be registered before the wildcard so JS/CSS assets are served with
    // the correct MIME types instead of returning index.html.
    const expressApp = app.getHttpAdapter().getInstance() as import('express').Application;
    const distPath = path.join(__dirname, '../../frontend/dist');
    expressApp.use('/', express.static(distPath));

    // Fallback to index.html for client-side routes
    // expressApp.get('*', (req: Request, res: Response) => {
    //   res.sendFile(path.join(distPath, 'index.html'));
    // });
  }


  await app.listen(5000);
}
bootstrap();