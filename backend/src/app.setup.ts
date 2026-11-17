import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim());
  app.enableCors({ origin: origins?.length ? origins : ['http://localhost:3000'], exposedHeaders: ['Idempotent-Replayed'] });
}
