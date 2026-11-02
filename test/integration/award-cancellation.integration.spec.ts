import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { RewardsService } from '../../src/rewards/rewards.service';
import { CancellationResolutionEnum } from '../../src/rewards/dto/create-reward.dto';

describe('Award Cancellation Workflow Integration Tests', () => {
  let module: TestingModule;
  let rewardsService: RewardsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    rewardsService = module.get<RewardsService>(RewardsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  it('should support IMMEDIATE_RETURN cancellation and restore stock/pacing', async () => {
    const day = await prisma.exhibitionDay.findFirst();
    const reward = await prisma.reward.findFirst({
      where: { inventoryMode: 'LIMITED', availablePhysicalStock: { gt: 5 } },
    });

    expect(day).toBeDefined();
    expect(reward).toBeDefined();

    const initialAvailable = reward!.availablePhysicalStock;

    // Create a participation, spin, and award
    const participation = await prisma.participation.create({
      data: {
        readableRef:
          'AWARD-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        exhibitionDayId: day!.id,
        visitorName: 'Voucher Winner',
        visitorPhone: '+94772223344',
        visitorPhoneRaw: '0772223344',
        status: 'COMPLETED',
      },
    });

    const wheelConfig = await prisma.wheelConfig.findFirst({
      where: { isPublished: true },
    });
    const wheelSlice = await prisma.wheelSlice.findFirst({
      where: { wheelConfigId: wheelConfig!.id },
    });

    const spin = await prisma.spinRecord.create({
      data: {
        participationId: participation.id,
        exhibitionDayId: day!.id,
        wheelConfigId: wheelConfig!.id,
        wheelSliceId: wheelSlice!.id,
        rewardId: reward!.id,
        sliceIndex: 0,
        isWin: true,
        idempotencyKey: crypto.randomUUID(),
        status: 'COMPLETED',
      },
    });

    const award = await prisma.award.create({
      data: {
        spinId: spin.id,
        participationId: participation.id,
        rewardId: reward!.id,
        exhibitionDayId: day!.id,
        status: 'AWARDED',
      },
    });

    // 1. Cancel with IMMEDIATE_RETURN
    const cancelRes = await rewardsService.cancelAward(
      award.id,
      {
        resolution: CancellationResolutionEnum.IMMEDIATE_RETURN,
        reason: 'Visitor failed to present ID within collection window',
      },
      'admin-id',
      'staff@mobios.lk',
    );

    expect(cancelRes.award.status).toBe('CANCELLED');
    expect(cancelRes.award.cancellationResolution).toBe(
      CancellationResolutionEnum.IMMEDIATE_RETURN,
    );

    // 2. Verify physical stock was restored (+1)
    const afterReward = await prisma.reward.findUnique({
      where: { id: reward!.id },
    });
    expect(afterReward?.availablePhysicalStock).toBe(initialAvailable + 1);

    // 3. Verify stock ledger entry
    const ledger = await prisma.stockLedgerEntry.findFirst({
      where: { referenceId: award.id },
    });
    expect(ledger?.entryType).toBe('AWARD_CANCELLED_RETURN_IMMEDIATE');

    // 4. Idempotent cancellation check
    const repeatCancel = await rewardsService.cancelAward(award.id, {
      resolution: CancellationResolutionEnum.IMMEDIATE_RETURN,
      reason: 'Second click',
    });
    expect(repeatCancel.message).toContain('already cancelled');

    // Revert test-induced increment so integration runs don't mutate persistent inventory
    await prisma.reward.update({
      where: { id: reward!.id },
      data: { availablePhysicalStock: initialAvailable },
    });
  });

  it('should support RETIRE resolution and update retiredStock without restoring available', async () => {
    const day = await prisma.exhibitionDay.findFirst();
    const reward = await prisma.reward.findFirst({
      where: { inventoryMode: 'LIMITED' },
    });

    const initialAvailable = reward!.availablePhysicalStock;
    const initialRetired = reward!.retiredStock;

    const participation = await prisma.participation.create({
      data: {
        readableRef:
          'RETIRE-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        exhibitionDayId: day!.id,
        visitorName: 'Damaged Item Winner',
        visitorPhone: '+94773334455',
        visitorPhoneRaw: '0773334455',
        status: 'COMPLETED',
      },
    });

    const wheelConfig = await prisma.wheelConfig.findFirst({
      where: { isPublished: true },
    });
    const wheelSlice = await prisma.wheelSlice.findFirst({
      where: { wheelConfigId: wheelConfig!.id },
    });

    const spin = await prisma.spinRecord.create({
      data: {
        participationId: participation.id,
        exhibitionDayId: day!.id,
        wheelConfigId: wheelConfig!.id,
        wheelSliceId: wheelSlice!.id,
        rewardId: reward!.id,
        sliceIndex: 1,
        isWin: true,
        idempotencyKey: crypto.randomUUID(),
        status: 'COMPLETED',
      },
    });

    const award = await prisma.award.create({
      data: {
        spinId: spin.id,
        participationId: participation.id,
        rewardId: reward!.id,
        exhibitionDayId: day!.id,
        status: 'AWARDED',
      },
    });

    // Cancel with RETIRE
    await rewardsService.cancelAward(
      award.id,
      {
        resolution: CancellationResolutionEnum.RETIRE,
        reason: 'Item was dropped and damaged before handover',
      },
      'admin-id',
      'staff@mobios.lk',
    );

    const afterReward = await prisma.reward.findUnique({
      where: { id: reward!.id },
    });
    expect(afterReward?.retiredStock).toBe(initialRetired + 1);
    expect(afterReward?.availablePhysicalStock).toBe(initialAvailable); // Available stock is NOT restored

    // Revert test-induced retiredStock increment
    await prisma.reward.update({
      where: { id: reward!.id },
      data: { retiredStock: initialRetired },
    });
  });
});
