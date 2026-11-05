import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../../src/health.controller';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

describe('Health endpoint', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves an unauthenticated liveness check without a database', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      data: { status: 'ok' },
    });
    expect(response.headers['cache-control']).toBe('no-store');
  });
});
