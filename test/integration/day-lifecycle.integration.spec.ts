import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { ExhibitionsService } from '../../src/exhibitions/exhibitions.service';

describe('Day Lifecycle Integration Tests', () => {
  let module: TestingModule;
  let exhibitionsService: ExhibitionsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    exhibitionsService = module.get<ExhibitionsService>(ExhibitionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  it('should enforce exactly one active day and handle idempotent transitions', async () => {
    const exhibition = await exhibitionsService.getActiveExhibition();
    expect(exhibition).toBeDefined();
    expect(exhibition?.days.length).toBeGreaterThanOrEqual(3);

    const day1 = exhibition!.days[0];
    const day2 = exhibition!.days[1];

    // Reset day 1 and 2 to UPCOMING for test isolation
    await prisma.exhibitionDay.update({
      where: { id: day1.id },
      data: { status: 'UPCOMING', actualStartedAt: null, actualEndedAt: null },
    });
    await prisma.exhibitionDay.update({
      where: { id: day2.id },
      data: { status: 'UPCOMING', actualStartedAt: null, actualEndedAt: null },
    });

    // 1. Start Day 1
    const startResult1 = await exhibitionsService.startDay(
      day1.id,
      'admin-id',
      'admin@mobios.lk',
    );
    expect(startResult1.day.status).toBe('IN_PROGRESS');
    expect(startResult1.day.actualStartedAt).toBeDefined();

    // 2. Idempotent check: starting Day 1 again succeeds without error
    const idempotentStart = await exhibitionsService.startDay(day1.id);
    expect(idempotentStart.message).toContain('already in progress');

    // 3. Invariant: Starting Day 2 while Day 1 is active must throw BadRequestException
    await expect(exhibitionsService.startDay(day2.id)).rejects.toThrow(
      BadRequestException,
    );

    // 4. Create a WAITING participation on Day 1
    const part = await prisma.participation.create({
      data: {
        readableRef:
          'TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        exhibitionDayId: day1.id,
        visitorName: 'Waiting Participant',
        visitorPhone: '+94770000001',
        visitorPhoneRaw: '0770000001',
        status: 'WAITING',
      },
    });

    // 5. End Day 1
    const endResult1 = await exhibitionsService.endDay(
      day1.id,
      'admin-id',
      'admin@mobios.lk',
    );
    expect(endResult1.day.status).toBe('COMPLETED');
    expect(endResult1.day.actualEndedAt).toBeDefined();

    // 6. Verify waiting participation is closed into DAY_CLOSED
    const updatedPart = await prisma.participation.findUnique({
      where: { id: part.id },
    });
    expect(updatedPart?.status).toBe('DAY_CLOSED');

    // 7. Idempotent end check
    const idempotentEnd = await exhibitionsService.endDay(day1.id);
    expect(idempotentEnd.message).toContain('already completed');

    // 8. Now that Day 1 is completed, Day 2 can be started
    const startResult2 = await exhibitionsService.startDay(day2.id);
    expect(startResult2.day.status).toBe('IN_PROGRESS');

    // Cleanup: restore Day 2 back to IN_PROGRESS for app default runtime
  });

  it('should support manual pause and resume independent of day completion', async () => {
    const exhibition = await exhibitionsService.getActiveExhibition();
    expect(exhibition).toBeDefined();

    // Pause exhibition
    const paused = await exhibitionsService.setPauseStatus(
      exhibition!.id,
      true,
    );
    expect(paused.isPaused).toBe(true);

    // Resume exhibition
    const resumed = await exhibitionsService.setPauseStatus(
      exhibition!.id,
      false,
    );
    expect(resumed.isPaused).toBe(false);
  });
});
