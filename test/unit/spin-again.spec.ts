import { SpinsService } from '../../src/spins/spins.service';

describe('SpinsService - Bonus Spin & Spin Again Mechanics', () => {
  let service: SpinsService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockAudit = {
      log: jest.fn().mockResolvedValue(true),
    };

    mockPrisma = {
      spinRecord: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      participation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      wheelConfig: {
        findFirst: jest.fn(),
      },
      priorityList: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      reward: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      dailyAllocation: {
        updateMany: jest.fn(),
      },
      stockLedgerEntry: {
        create: jest.fn(),
      },
      award: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
    };

    service = new SpinsService(mockPrisma, mockAudit);
  });

  it('correctly identifies "Spin Again" and "Bonus Spin" slices as re-spin outcomes', () => {
    const isSpinAgain = (service as any).isSpinAgainReward.bind(service);

    expect(isSpinAgain({ label: 'Spin Again' })).toBe(true);
    expect(isSpinAgain({ label: 'Bonus Spin' })).toBe(true);
    expect(isSpinAgain({ label: 'Extra Spin!' })).toBe(true);
    expect(isSpinAgain({ label: 'Another Chance' })).toBe(true);
    expect(isSpinAgain({ label: 'Voucher', reward: { name: 'Bonus Spin' } })).toBe(true);
    expect(isSpinAgain({ label: 'Slice 3', reward: { shortLabel: 'Spin Again' } })).toBe(true);

    expect(isSpinAgain({ label: 'Try Again' })).toBe(false);
    expect(isSpinAgain({ label: 'Samsung Fit 3', reward: { name: 'Samsung Fit 3' } })).toBe(false);
    expect(isSpinAgain({ label: 'Better Luck Next Time' })).toBe(false);
  });

  it('handles Bonus Spin: keeps participation in SELECTED state and flags isSpinAgain: true', async () => {
    const participationId = 'part-123';
    const dayId = 'day-1';

    const mockParticipation = {
      id: participationId,
      readableRef: 'MOB-TEST',
      visitorName: 'John Doe',
      status: 'SELECTED',
      exhibitionDayId: dayId,
      exhibitionDay: {
        id: dayId,
        date: '2026-11-06',
        pacingEndTime: '21:00:00',
        status: 'IN_PROGRESS',
        actualStartedAt: new Date(),
        exhibition: { isPaused: false },
      },
      spin: null,
    };

    const bonusSlice = {
      id: 'slice-spin-again',
      sliceIndex: 3,
      label: 'Spin Again',
      isNoWin: false,
      rewardId: 'rew-bonus',
      reward: {
        id: 'rew-bonus',
        name: 'Bonus Spin',
        shortLabel: 'Spin Again',
        type: 'NO_WIN',
        inventoryMode: 'NO_WIN',
        isActive: true,
        baselineWeight: 5,
        dailyAllocations: [],
        availablePhysicalStock: 0,
      },
    };

    mockPrisma.participation.findUnique.mockResolvedValue(mockParticipation);
    mockPrisma.spinRecord.findUnique.mockResolvedValue(null);
    mockPrisma.wheelConfig.findFirst.mockResolvedValue({
      id: 'wheel-1',
      slices: [bonusSlice],
    });

    const mockSpinRecord = {
      id: 'spin-rec-1',
      participationId,
      sliceIndex: 3,
      isWin: false,
      wheelSlice: bonusSlice,
      reward: bonusSlice.reward,
      participation: mockParticipation,
      completedAt: null,
    };
    mockPrisma.spinRecord.upsert.mockResolvedValue(mockSpinRecord);

    const result = await service.executeSpin({
      participationId,
      idempotencyKey: 'idemp-1',
    });

    expect(result.isSpinAgain).toBe(true);
    expect(result.isWin).toBe(false);
    expect(result.sliceLabel).toBe('Spin Again');

    // Participation must NOT be set to COMPLETED
    expect(mockPrisma.participation.update).not.toHaveBeenCalled();

    // Award must NOT be created
    expect(mockPrisma.award.create).not.toHaveBeenCalled();

    // Spin record must be upserted with SELECTED status
    expect(mockPrisma.spinRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { participationId },
        create: expect.objectContaining({
          status: 'SELECTED',
          isWin: false,
        }),
      }),
    );

    // Audit log should record BONUS_SPIN_AWARDED
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BONUS_SPIN_AWARDED',
        resourceId: participationId,
      }),
    );
  });

  it('allows the same participant to spin again when remaining in SELECTED state', async () => {
    const participationId = 'part-123';
    const dayId = 'day-1';

    // Second spin: participant is STILL in SELECTED state
    const mockParticipation = {
      id: participationId,
      readableRef: 'MOB-TEST',
      visitorName: 'John Doe',
      status: 'SELECTED',
      exhibitionDayId: dayId,
      exhibitionDay: {
        id: dayId,
        date: '2026-11-06',
        pacingEndTime: '21:00:00',
        status: 'IN_PROGRESS',
        actualStartedAt: new Date(Date.now() - 7200000), // 2 hours ago so pacing has elapsed
        exhibition: { isPaused: false },
      },
      spin: null,
    };

    const fallbackSlice = {
      id: 'slice-fallback',
      sliceIndex: 1,
      label: 'Digital VIP Pass',
      isNoWin: false,
      rewardId: 'rew-vip',
      reward: {
        id: 'rew-vip',
        name: 'Digital VIP Pass',
        shortLabel: 'VIP Pass',
        type: 'VOUCHER',
        inventoryMode: 'UNLIMITED',
        availablePhysicalStock: 0,
        isActive: true,
        baselineWeight: 1,
        dailyAllocations: [],
      },
    };

    const winSlice = {
      id: 'slice-voucher',
      sliceIndex: 0,
      label: 'Eventure Voucher',
      isNoWin: false,
      rewardId: 'rew-voucher',
      reward: {
        id: 'rew-voucher',
        name: 'Voucher LKR 1000',
        shortLabel: 'Voucher',
        type: 'VOUCHER',
        inventoryMode: 'LIMITED',
        availablePhysicalStock: 50,
        isActive: true,
        baselineWeight: 100000,
        dailyAllocations: [
          {
            exhibitionDayId: dayId,
            allocatedQuantity: 20,
            carriedForwardQuantity: 0,
            awardedQuantity: 0,
          },
        ],
      },
    };

    mockPrisma.participation.findUnique.mockResolvedValue(mockParticipation);
    mockPrisma.spinRecord.findUnique.mockResolvedValue(null);
    mockPrisma.wheelConfig.findFirst.mockResolvedValue({
      id: 'wheel-1',
      slices: [winSlice, fallbackSlice],
    });
    mockPrisma.reward.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.dailyAllocation.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.reward.findUnique.mockResolvedValue({ availablePhysicalStock: 49 });

    const finalSpinRecord = {
      id: 'spin-rec-1',
      participationId,
      sliceIndex: 0,
      isWin: true,
      wheelSlice: winSlice,
      reward: winSlice.reward,
      participation: mockParticipation,
      completedAt: new Date(),
    };
    mockPrisma.spinRecord.upsert.mockResolvedValue(finalSpinRecord);

    const result = await service.executeSpin({
      participationId,
      idempotencyKey: 'idemp-2', // New idempotency key for the second spin
    });

    expect(result.isSpinAgain).toBe(false);
    expect(result.isWin).toBe(true);

    // Final spin now marks participation as COMPLETED
    expect(mockPrisma.participation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: participationId },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );

    // Final win creates an Award
    expect(mockPrisma.award.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participationId,
          rewardId: 'rew-voucher',
          status: 'AWARDED',
        }),
      }),
    );
  });
});
