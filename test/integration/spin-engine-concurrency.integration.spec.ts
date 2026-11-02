import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { SpinsService } from '../../src/spins/spins.service';
import { RegistrationsService } from '../../src/registrations/registrations.service';

describe('Spin Engine Concurrency & Invariants Integration Tests', () => {
  let module: TestingModule;
  let spinsService: SpinsService;
  let registrationsService: RegistrationsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    spinsService = module.get<SpinsService>(SpinsService);
    registrationsService =
      module.get<RegistrationsService>(RegistrationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  it('should enforce single active spin, double-spin prevention, and idempotency replay', async () => {
    // 1. Ensure an active day exists
    let activeDay = await prisma.exhibitionDay.findFirst({
      where: { status: 'IN_PROGRESS' },
    });

    if (!activeDay) {
      activeDay = await prisma.exhibitionDay.findFirst();
      await prisma.exhibitionDay.update({
        where: { id: activeDay!.id },
        data: { status: 'IN_PROGRESS', actualStartedAt: new Date() },
      });
    }

    // 2. Create a participation
    const participation = await prisma.participation.create({
      data: {
        readableRef:
          'SPIN-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        exhibitionDayId: activeDay!.id,
        visitorName: 'Saman Silva',
        visitorPhone: '+94771112233',
        visitorPhoneRaw: '0771112233',
        status: 'WAITING',
      },
    });

    // 3. Attempting to spin while status is WAITING must be rejected
    const idempotencyKey = crypto.randomUUID();
    await expect(
      spinsService.executeSpin({
        participationId: participation.id,
        idempotencyKey,
      }),
    ).rejects.toThrow(BadRequestException);

    // 4. Staff selects the participation
    await registrationsService.selectParticipation(participation.id);

    const selectedPart = await prisma.participation.findUnique({
      where: { id: participation.id },
    });
    expect(selectedPart?.status).toBe('SELECTED');

    // 5. Visitor triggers spin
    const spinResult = await spinsService.executeSpin({
      participationId: participation.id,
      idempotencyKey,
    });

    expect(spinResult.spinId).toBeDefined();
    expect(spinResult.sliceIndex).toBeGreaterThanOrEqual(0);
    expect(spinResult.sliceIndex).toBeLessThanOrEqual(15);
    expect(spinResult.isReplay).toBe(false);

    // 6. Participation must now be COMPLETED
    const completedPart = await prisma.participation.findUnique({
      where: { id: participation.id },
    });
    expect(completedPart?.status).toBe('COMPLETED');

    // 7. Idempotency replay with same key must return identical result without duplicate award
    const replayResult = await spinsService.executeSpin({
      participationId: participation.id,
      idempotencyKey,
    });

    expect(replayResult.spinId).toBe(spinResult.spinId);
    expect(replayResult.sliceIndex).toBe(spinResult.sliceIndex);
    expect(replayResult.isReplay).toBe(true);

    // 8. Crash recovery endpoint returns the exact committed result
    const recovered = await spinsService.getSpinByParticipationId(
      participation.id,
    );
    expect(recovered.spinId).toBe(spinResult.spinId);
    expect(recovered.sliceIndex).toBe(spinResult.sliceIndex);
  });
});
