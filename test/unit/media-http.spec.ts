import { Controller, Get } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { merchantLogoDirectory } from '../../src/merchants/merchant-logo';

const filename = 'cebba2ea-7614-4aab-8284-94b9d603d7e1.png';

@Controller('merchants')
class MediaController {
  @Get()
  list() {
    return [{ logoUrl: `/api/v1/merchant-logos/${filename}` }];
  }
}

describe('local merchant media HTTP contract', () => {
  let app: NestExpressApplication;
  const previous = process.env.PUBLIC_MEDIA_BASE_URL;
  const previousDirectory = process.env.MERCHANT_LOGO_DIR;
  let directory: string;

  beforeAll(async () => {
    process.env.PUBLIC_MEDIA_BASE_URL = 'http://localhost:3010/';
    directory = await mkdtemp(join(tmpdir(), 'merchant-media-'));
    process.env.MERCHANT_LOGO_DIR = directory;
    await writeFile(join(directory, filename), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY7cAAAAASUVORK5CYII=', 'base64'));
    const module = await Test.createTestingModule({ controllers: [MediaController] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    app.useStaticAssets(merchantLogoDirectory(), { prefix: '/merchant-logos', index: false });
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await rm(directory, { recursive: true, force: true });
    if (previousDirectory === undefined) delete process.env.MERCHANT_LOGO_DIR;
    else process.env.MERCHANT_LOGO_DIR = previousDirectory;
    if (previous === undefined) delete process.env.PUBLIC_MEDIA_BASE_URL;
    else process.env.PUBLIC_MEDIA_BASE_URL = previous;
  });

  it('serves the image at the URL returned to the frontend', async () => {
    const response = await request(app.getHttpServer()).get('/merchants').expect(200);
    const url = new URL(response.body.data[0].logoUrl);
    expect(url.origin).toBe('http://localhost:3010');
    const image = await request(app.getHttpServer()).get(url.pathname).expect(200).expect('Content-Type', /image\/png/);
    expect(image.body.subarray(0, 8)).toEqual(Buffer.from('89504e470d0a1a0a', 'hex'));
  });
});
