import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  CreateRewardDto,
  UpdateRewardDto,
  AdjustStockDto,
  CancelAwardDto,
  InventoryModeEnum,
  DistributionStrategyEnum,
  CancellationResolutionEnum,
} from './dto/create-reward.dto';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * Distributes stock evenly across remaining active/upcoming exhibition days.
   */
  private computeAutoDailyDistribution(
    totalStock: number,
    days: { id: string; dayNumber: number }[],
  ): Map<string, number> {
    const result = new Map<string, number>();
    if (days.length === 0 || totalStock <= 0) return result;

    const basePerDay = Math.floor(totalStock / days.length);
    let remainder = totalStock % days.length;

    for (const day of days) {
      let qty = basePerDay;
      if (remainder > 0) {
        qty += 1;
        remainder -= 1;
      }
      result.set(day.id, qty);
    }

    return result;
  }

  async create(dto: CreateRewardDto, userId?: string, userEmail?: string, videoUrl?: string) {
    if (dto.isVideoShow && !videoUrl) throw new BadRequestException('Upload a video before enabling Show video on win');
    if (
      dto.inventoryMode === InventoryModeEnum.LIMITED &&
      (!dto.totalPhysicalStock || dto.totalPhysicalStock <= 0)
    ) {
      throw new BadRequestException(
        'Total physical stock must be greater than 0 for LIMITED rewards',
      );
    }

    const totalStock =
      dto.inventoryMode === InventoryModeEnum.LIMITED
        ? dto.totalPhysicalStock
        : 0;

    // Validate merchant if provided
    if (dto.merchantId) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { id: dto.merchantId },
      });
      if (!merchant) {
        throw new NotFoundException(
          `Merchant with ID ${dto.merchantId} not found`,
        );
      }
    }

    // Get active exhibition days
    const activeExhibition = await this.prisma.exhibition.findFirst({
      where: { isActive: true },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!activeExhibition || activeExhibition.days.length === 0) {
      throw new BadRequestException(
        'No active exhibition with days found to allocate rewards',
      );
    }

    // Find eligible days (IN_PROGRESS or UPCOMING)
    const eligibleDays = activeExhibition.days.filter(
      (d) => d.status !== 'COMPLETED',
    );

    if (eligibleDays.length === 0) {
      throw new BadRequestException(
        'All exhibition days are already completed',
      );
    }

    // Validate custom allocations if CUSTOM_DAILY
    if (dto.distributionStrategy === DistributionStrategyEnum.CUSTOM_DAILY) {
      if (!dto.customDailyAllocations) {
        throw new BadRequestException(
          'customDailyAllocations must be provided when strategy is CUSTOM_DAILY',
        );
      }
      const sumAllocated = Object.values(dto.customDailyAllocations).reduce(
        (a, b) => a + Number(b),
        0,
      );
      if (sumAllocated > totalStock) {
        throw new BadRequestException(
          `Sum of custom daily allocations (${sumAllocated}) exceeds total physical stock (${totalStock})`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create reward record
      const reward = await tx.reward.create({
        data: {
          merchantId: dto.merchantId || null,
          name: dto.name.trim(),
          description: dto.description || null,
          type: dto.type,
          shortLabel: dto.shortLabel.trim(),
          inventoryMode: dto.inventoryMode,
          distributionStrategy: dto.distributionStrategy,
          totalPhysicalStock: totalStock,
          availablePhysicalStock: totalStock,
          retiredStock: 0,
          carryForward: dto.carryForward ?? true,
          baselineWeight: dto.baselineWeight ?? 3,
          colorHex: dto.colorHex || null,
          iconUrl: dto.iconUrl || null,
          videoUrl: videoUrl || null,
          isVideoShow: dto.isVideoShow ?? false,
        },
      });

      // 2. Initial Stock Ledger entry
      if (totalStock > 0) {
        await tx.stockLedgerEntry.create({
          data: {
            rewardId: reward.id,
            entryType: 'INITIAL_STOCK',
            quantityDelta: totalStock,
            balanceAfter: totalStock,
            notes: 'Initial physical inventory deposit',
            createdBy: userEmail || 'ADMIN',
          },
        });
      }

      // 3. Create DailyAllocations
      if (dto.distributionStrategy === DistributionStrategyEnum.AUTO_DAILY) {
        const distribution = this.computeAutoDailyDistribution(
          totalStock,
          eligibleDays,
        );
        for (const day of activeExhibition.days) {
          const qty = distribution.get(day.id) || 0;
          await tx.dailyAllocation.create({
            data: {
              rewardId: reward.id,
              exhibitionDayId: day.id,
              allocatedQuantity: qty,
              carriedForwardQuantity: 0,
              awardedQuantity: 0,
            },
          });
        }
      } else if (
        dto.distributionStrategy === DistributionStrategyEnum.CUSTOM_DAILY
      ) {
        for (const day of activeExhibition.days) {
          const qty = Number(dto.customDailyAllocations?.[day.id]) || 0;
          await tx.dailyAllocation.create({
            data: {
              rewardId: reward.id,
              exhibitionDayId: day.id,
              allocatedQuantity: qty,
              carriedForwardQuantity: 0,
              awardedQuantity: 0,
            },
          });
        }
      } else {
        // EXHIBITION_WIDE: allocate full stock to current/active day pool
        for (const day of activeExhibition.days) {
          await tx.dailyAllocation.create({
            data: {
              rewardId: reward.id,
              exhibitionDayId: day.id,
              allocatedQuantity: totalStock,
              carriedForwardQuantity: 0,
              awardedQuantity: 0,
            },
          });
        }
      }

      await this.auditService.log({
        userId,
        userEmail,
        action: 'REWARD_CREATED',
        resourceType: 'REWARD',
        resourceId: reward.id,
        payload: {
          name: reward.name,
          totalStock,
          strategy: reward.distributionStrategy,
        },
      });

      return reward;
    });
  }

  async findAll(onlyActive = true) {
    return this.prisma.reward.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: {
        merchant: {
          select: { id: true, name: true, logoUrl: true, primaryColor: true },
        },
        dailyAllocations: {
          include: {
            exhibitionDay: {
              select: {
                dayNumber: true,
                label: true,
                date: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: { awards: true, spins: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: {
        merchant: true,
        dailyAllocations: {
          include: {
            exhibitionDay: true,
          },
        },
        stockLedger: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    return reward;
  }

  async update(
    id: string,
    dto: UpdateRewardDto,
    userId?: string,
    userEmail?: string,
    videoUrl?: string | null,
  ) {
    const previous = await this.findOne(id);
    const nextVideoUrl = videoUrl === undefined ? previous.videoUrl : videoUrl;
    const isVideoShow = dto.isVideoShow ?? (videoUrl === null ? false : previous.isVideoShow);
    if (isVideoShow && !nextVideoUrl) throw new BadRequestException('Upload a video before enabling Show video on win');

    let merchantIdToSet: string | null | undefined = undefined;
    if (dto.merchantId !== undefined) {
      if (!dto.merchantId || (typeof dto.merchantId === 'string' && dto.merchantId.trim() === '')) {
        merchantIdToSet = null;
      } else {
        const merchant = await this.prisma.merchant.findUnique({
          where: { id: dto.merchantId },
        });
        if (!merchant) {
          throw new BadRequestException(
            `Merchant with ID ${dto.merchantId} not found`,
          );
        }
        merchantIdToSet = dto.merchantId;
      }
    }

    const updated = await this.prisma.reward.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        description: dto.description,
        shortLabel: dto.shortLabel ? dto.shortLabel.trim() : undefined,
        merchantId: merchantIdToSet !== undefined ? merchantIdToSet : undefined,
        carryForward: dto.carryForward,
        baselineWeight: dto.baselineWeight,
        colorHex: dto.colorHex,
        iconUrl: dto.iconUrl,
        isActive: dto.isActive,
        videoUrl,
        isVideoShow,
      },
      include: {
        merchant: true,
      },
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'REWARD_UPDATED',
      resourceType: 'REWARD',
      resourceId: id,
      payload: dto,
    });

    this.realtime.emitWheelConfigUpdated({ rewardId: id });
    return updated;
  }

  /**
   * Safe audited stock increase or reduction.
   * Invariant: Cannot reduce below already awarded items.
   */
  async adjustStock(
    id: string,
    dto: AdjustStockDto,
    userId?: string,
    userEmail?: string,
  ) {
    const reward = await this.findOne(id);

    if (reward.inventoryMode !== 'LIMITED') {
      throw new BadRequestException(
        'Stock adjustments only apply to LIMITED inventory rewards',
      );
    }

    const currentTotal = reward.totalPhysicalStock;
    const currentAvailable = reward.availablePhysicalStock;
    const awardedCount = currentTotal - currentAvailable - reward.retiredStock;

    const newTotal = currentTotal + dto.quantityDelta;
    const newAvailable = currentAvailable + dto.quantityDelta;

    if (newTotal < awardedCount) {
      throw new BadRequestException(
        `Cannot reduce stock by ${Math.abs(dto.quantityDelta)}. Minimum physical stock required is ${awardedCount} (already awarded).`,
      );
    }

    if (newAvailable < 0) {
      throw new BadRequestException(
        `Cannot reduce available stock below 0. Currently available: ${currentAvailable}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update reward
      const updatedReward = await tx.reward.update({
        where: { id },
        data: {
          totalPhysicalStock: newTotal,
          availablePhysicalStock: newAvailable,
        },
      });

      // 2. Add ledger entry
      await tx.stockLedgerEntry.create({
        data: {
          rewardId: id,
          entryType: 'ADMIN_ADJUSTMENT',
          quantityDelta: dto.quantityDelta,
          balanceAfter: newAvailable,
          notes: dto.notes,
          createdBy: userEmail || 'ADMIN',
        },
      });

      // 3. If AUTO_DAILY, rebalance remaining uncompleted days
      if (reward.distributionStrategy === 'AUTO_DAILY') {
        const remainingDays = await tx.exhibitionDay.findMany({
          where: { status: { in: ['IN_PROGRESS', 'UPCOMING'] } },
          orderBy: { dayNumber: 'asc' },
        });

        if (remainingDays.length > 0) {
          const rebalanceMap = this.computeAutoDailyDistribution(
            newAvailable,
            remainingDays,
          );
          for (const day of remainingDays) {
            const newAlloc = rebalanceMap.get(day.id) || 0;
            await tx.dailyAllocation.updateMany({
              where: {
                rewardId: id,
                exhibitionDayId: day.id,
              },
              data: {
                allocatedQuantity: newAlloc,
              },
            });
          }
        }
      }

      await this.auditService.log({
        userId,
        userEmail,
        action: 'STOCK_ADJUSTED',
        resourceType: 'REWARD',
        resourceId: id,
        payload: {
          delta: dto.quantityDelta,
          newTotal,
          newAvailable,
          notes: dto.notes,
        },
      });

      return updatedReward;
    });
  }

  /**
   * Staff cancels an uncollected award.
   * Resolutions:
   * 1. IMMEDIATE_RETURN: Restores 1 unit to current day's active pacing quota and physical stock.
   * 2. RETURN_TO_PACING: Restores physical stock, leaves today's quota closed, adds to overall balance.
   * 3. RETIRE: Increments retiredStock, does NOT return to available pool.
   */
  async cancelAward(
    awardId: string,
    dto: CancelAwardDto,
    userId?: string,
    userEmail?: string,
  ) {
    const award = await this.prisma.award.findUnique({
      where: { id: awardId },
      include: {
        reward: true,
        exhibitionDay: true,
      },
    });

    if (!award) {
      throw new NotFoundException(`Award with ID ${awardId} not found`);
    }

    // Idempotent check
    if (award.status === 'CANCELLED') {
      return {
        message: 'Award was already cancelled',
        award,
      };
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      let ledgerType: any;

      if (dto.resolution === CancellationResolutionEnum.IMMEDIATE_RETURN) {
        ledgerType = 'AWARD_CANCELLED_RETURN_IMMEDIATE';

        // 1. Restore available physical stock
        await tx.reward.update({
          where: { id: award.rewardId },
          data: {
            availablePhysicalStock: { increment: 1 },
          },
        });

        // 2. Decrement current day's awarded quantity on daily allocation
        await tx.dailyAllocation.updateMany({
          where: {
            rewardId: award.rewardId,
            exhibitionDayId: award.exhibitionDayId,
          },
          data: {
            awardedQuantity: { decrement: 1 },
          },
        });
      } else if (
        dto.resolution === CancellationResolutionEnum.RETURN_TO_PACING
      ) {
        ledgerType = 'AWARD_CANCELLED_RETURN_PACING';

        // 1. Restore physical stock
        await tx.reward.update({
          where: { id: award.rewardId },
          data: {
            availablePhysicalStock: { increment: 1 },
          },
        });
      } else if (dto.resolution === CancellationResolutionEnum.RETIRE) {
        ledgerType = 'AWARD_CANCELLED_RETIRE';

        // Stock was already removed from available; mark it retired
        await tx.reward.update({
          where: { id: award.rewardId },
          data: {
            retiredStock: { increment: 1 },
          },
        });
      }

      // Record stock ledger entry
      const updatedReward = await tx.reward.findUnique({
        where: { id: award.rewardId },
      });

      await tx.stockLedgerEntry.create({
        data: {
          rewardId: award.rewardId,
          exhibitionDayId: award.exhibitionDayId,
          entryType: ledgerType,
          quantityDelta:
            dto.resolution === CancellationResolutionEnum.RETIRE ? 0 : 1,
          balanceAfter: updatedReward?.availablePhysicalStock || 0,
          referenceId: award.id,
          notes: `Award cancelled: ${dto.reason} (${dto.resolution})`,
          createdBy: userEmail || 'ADMIN',
        },
      });

      // Update award status
      const updatedAward = await tx.award.update({
        where: { id: award.id },
        data: {
          status: 'CANCELLED',
          cancellationResolution: dto.resolution,
          cancellationReason: dto.reason,
          cancelledBy: userEmail || 'ADMIN',
          cancelledAt: now,
        },
      });

      await this.auditService.log({
        userId,
        userEmail,
        action: 'AWARD_CANCELLED',
        resourceType: 'AWARD',
        resourceId: award.id,
        payload: {
          rewardId: award.rewardId,
          resolution: dto.resolution,
          reason: dto.reason,
        },
      });

      return {
        message: `Award successfully cancelled with resolution ${dto.resolution}`,
        award: updatedAward,
      };
    });
  }

  async getAwards(exhibitionDayId?: string) {
    return this.prisma.award.findMany({
      where: exhibitionDayId ? { exhibitionDayId } : undefined,
      include: {
        reward: true,
        participation: true,
        exhibitionDay: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
