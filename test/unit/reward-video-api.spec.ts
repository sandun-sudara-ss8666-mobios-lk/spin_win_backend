import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RewardsController } from '../../src/rewards/rewards.controller';
import { RewardsService } from '../../src/rewards/rewards.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { RealtimeGateway } from '../../src/realtime/realtime.gateway';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';

describe('reward video HTTP contract', () => {
  let app: INestApplication;
  let directory: string;
  const rewards = new Map<string, any>();
  const file = Buffer.from(
    '000000186674797069736f6d0000000069736f6d6d703432',
    'hex',
  );
  const input = {
    name: 'Prize',
    shortLabel: 'Prize',
    type: 'VOUCHER',
    inventoryMode: 'UNLIMITED',
    distributionStrategy: 'AUTO_DAILY',
    totalPhysicalStock: 0,
  };

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'reward-video-api-'));
    process.env.REWARD_VIDEO_DIR = directory;
    const prisma: any = {
      reward: {
        create: async ({ data }: any) => {
          const reward = { id: String(rewards.size + 1), ...data };
          rewards.set(reward.id, reward);
          return reward;
        },
        findUnique: async ({ where }: any) => rewards.get(where.id),
        update: async ({ where, data }: any) => {
          const reward = {
            ...rewards.get(where.id),
            ...Object.fromEntries(
              Object.entries(data).filter(([, value]) => value !== undefined),
            ),
          };
          rewards.set(where.id, reward);
          return reward;
        },
      },
      exhibition: {
        findFirst: async () => ({
          days: [{ id: 'day-1', status: 'IN_PROGRESS' }],
        }),
      },
      dailyAllocation: { create: async () => ({}) },
      $transaction: async (fn: any) => fn(prisma),
    };
    const module = await Test.createTestingModule({
      controllers: [RewardsController],
      providers: [
        RewardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: async () => undefined } },
        {
          provide: RealtimeGateway,
          useValue: { emitWheelConfigUpdated: () => undefined },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'staff', email: 'staff@example.test' };
          return req.headers.authorization === 'Bearer test-only';
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    delete process.env.REWARD_VIDEO_DIR;
    await rm(directory, { recursive: true, force: true });
  });

  it('requires staff authentication for uploads', async () => {
    await request(app.getHttpServer()).post('/rewards').send(input).expect(403);
  });

  it('supports JSON creation without video and rejects enabling a missing video', async () => {
    const response = await request(app.getHttpServer())
      .post('/rewards')
      .set('Authorization', 'Bearer test-only')
      .send(input)
      .expect(201);
    expect(response.body).toMatchObject({ videoUrl: null, isVideoShow: false });
    await request(app.getHttpServer())
      .post('/rewards')
      .set('Authorization', 'Bearer test-only')
      .send({ ...input, isVideoShow: true })
      .expect(400);
  });

  it('creates, toggles, replaces, and removes a video without losing stock fields', async () => {
    let create = request(app.getHttpServer())
      .post('/rewards')
      .set('Authorization', 'Bearer test-only');
    for (const [key, value] of Object.entries({
      ...input,
      isVideoShow: 'true',
      carryForward: 'false',
      customDailyAllocations: '{"day-1":0}',
    }))
      create = create.field(key, String(value));
    const response = await create
      .attach('video', file, 'video.mp4')
      .expect(201);
    const id = response.body.id;
    const originalUrl = response.body.videoUrl;
    expect(response.body).toMatchObject({
      isVideoShow: true,
      carryForward: false,
      totalPhysicalStock: 0,
    });
    expect(await readdir(directory)).toHaveLength(1);

    const disabled = await request(app.getHttpServer())
      .patch(`/rewards/${id}`)
      .set('Authorization', 'Bearer test-only')
      .send({ isVideoShow: false })
      .expect(200);
    expect(disabled.body).toMatchObject({
      isVideoShow: false,
      videoUrl: originalUrl,
    });

    const replaced = await request(app.getHttpServer())
      .patch(`/rewards/${id}`)
      .set('Authorization', 'Bearer test-only')
      .field('isVideoShow', 'true')
      .field('removeVideo', 'false')
      .field('isActive', 'false')
      .attach('video', file, 'replacement.mp4')
      .expect(200);
    expect(replaced.body.videoUrl).not.toBe(originalUrl);
    expect(replaced.body).toMatchObject({ isVideoShow: true, isActive: false });
    expect(await readdir(directory)).toHaveLength(1);

    const removed = await request(app.getHttpServer())
      .patch(`/rewards/${id}`)
      .set('Authorization', 'Bearer test-only')
      .send({ removeVideo: true })
      .expect(200);
    expect(removed.body).toMatchObject({ videoUrl: null, isVideoShow: false });
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects oversized files before validation and persistence', async () => {
    await request(app.getHttpServer())
      .post('/rewards')
      .set('Authorization', 'Bearer test-only')
      .attach('video', Buffer.alloc(15_000_001), 'huge.mp4')
      .expect(413);
  });
});
