import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PacingCalculator } from '../common/utils/pacing.calculator';
import { PriorityCurveCalculator } from '../common/utils/priority-curve.calculator';
import { ExecuteSpinDto } from './dto/execute-spin.dto';

const rewardWithMerchant = {
  include: { merchant: { select: { name: true, logoUrl: true } } },
} as const;

@Injectable()
export class SpinsService {
  private readonly logger = new Logger(SpinsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Executes a spin authoritative on the backend.
   * Atomically commits outcome, stock deduction, and participation completion.
   */
  async executeSpin(dto: ExecuteSpinDto) {
    const { participationId, idempotencyKey } = dto;

    // 1. Check idempotency: if spin with this idempotencyKey already exists, return it
    const existingByIdempotency = await this.prisma.spinRecord.findUnique({
      where: { idempotencyKey },
      include: {
        reward: rewardWithMerchant,
        wheelSlice: true,
        participation: true,
      },
    });

    if (existingByIdempotency) {
      this.logger.log(
        `Idempotent spin replay requested for key ${idempotencyKey}`,
      );
      return this.formatSpinResponse(existingByIdempotency, true);
    }

    // 2. Fetch participation and check status
    const participation = await this.prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        exhibitionDay: {
          include: { exhibition: true },
        },
        spin: {
          include: {
            reward: rewardWithMerchant,
            wheelSlice: true,
            participation: true,
          },
        },
      },
    });

    if (!participation) {
      throw new NotFoundException(`Participation ${participationId} not found`);
    }

    // If participation already spun, return existing spin
    if (participation.status === 'COMPLETED' && participation.spin) {
      this.logger.log(
        `Participation ${participationId} already completed spin. Returning existing result.`,
      );
      return this.formatSpinResponse(participation.spin, true);
    }

    if (participation.status !== 'SELECTED') {
      throw new BadRequestException(
        `Participation must be in SELECTED state to spin. Current state: ${participation.status}. Please have staff select the participant first.`,
      );
    }

    const day = participation.exhibitionDay;
    if (day.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Cannot spin: Exhibition day is currently ${day.status}`,
      );
    }

    if (day.exhibition.isPaused) {
      throw new BadRequestException(
        'Cannot spin: Exhibition is currently paused by admin',
      );
    }

    // 3. Get published wheel configuration
    const wheelConfig = await this.prisma.wheelConfig.findFirst({
      where: { isPublished: true },
      include: {
        slices: {
          orderBy: { sliceIndex: 'asc' },
          include: {
            reward: {
              include: {
                dailyAllocations: true,
              },
            },
          },
        },
      },
    });

    if (!wheelConfig || wheelConfig.slices.length === 0) {
      throw new BadRequestException(
        'No active published wheel configuration found',
      );
    }

    // 4. Get active priority ranking list if published
    const activePriorityList = await this.prisma.priorityList.findFirst({
      where: { status: 'PUBLISHED' },
      include: { items: true },
    });

    const rankMap = new Map<string, number>();
    if (activePriorityList) {
      for (const item of activePriorityList.items) {
        rankMap.set(item.rewardId, item.rank);
      }
    }

    const now = new Date();
    const refEnd = PacingCalculator.parseTimeStringOnDate(
      day.date,
      day.pacingEndTime,
    );

    // 5. Evaluate eligibility and calculate weights for each slice
    interface EligibleSliceChoice {
      slice: (typeof wheelConfig.slices)[0];
      finalWeight: number;
      cumulativeUpper: number;
    }

    const eligibleChoices: EligibleSliceChoice[] = [];
    let runningCumulative = 0;
    let fallbackSlice: (typeof wheelConfig.slices)[0] | null = null;

    const totalRanked = activePriorityList
      ? activePriorityList.items.length
      : 0;

    for (const slice of wheelConfig.slices) {
      // Check if this slice is a valid fallback outcome
      if (
        slice.isNoWin ||
        (slice.reward &&
          (slice.reward.inventoryMode === 'UNLIMITED' ||
            slice.reward.inventoryMode === 'NO_WIN'))
      ) {
        if (!fallbackSlice) {
          fallbackSlice = slice;
        }
      }

      if (slice.isNoWin || !slice.reward) {
        // Fallback NO_WIN slice: always eligible with positive baseline weight
        const baseline = 10;
        runningCumulative += baseline;
        eligibleChoices.push({
          slice,
          finalWeight: baseline,
          cumulativeUpper: runningCumulative,
        });
        continue;
      }

      const reward = slice.reward;
      let isEligible = reward.isActive;

      if (reward.inventoryMode === 'LIMITED') {
        if (reward.availablePhysicalStock <= 0) {
          isEligible = false;
        } else {
          // Dynamic Pacing calculation
          const alloc = reward.dailyAllocations.find(
            (a) => a.exhibitionDayId === day.id,
          );
          const totalTarget =
            (alloc?.allocatedQuantity || 0) +
            (alloc?.carriedForwardQuantity || 0);
          const awarded = alloc?.awardedQuantity || 0;

          const pacing = PacingCalculator.calculate({
            serverTime: now,
            dayActualStart: day.actualStartedAt || now,
            referenceEnd: refEnd,
            dailyTargetAllocation: totalTarget,
            awardedToday: awarded,
            availablePhysicalStock: reward.availablePhysicalStock,
          });

          isEligible = pacing.eligibleForSpin;
        }
      }

      if (isEligible) {
        const baseline = Math.max(1, reward.baselineWeight || 3);
        const rank = rankMap.get(reward.id) || null;
        const multiplier = rank
          ? PriorityCurveCalculator.getMultiplier(rank, totalRanked)
          : 1.0;
        const finalWeight = Math.round(baseline * multiplier * 100) / 100;

        runningCumulative += finalWeight;
        eligibleChoices.push({
          slice,
          finalWeight,
          cumulativeUpper: runningCumulative,
        });
      }
    }

    // 6. Select winning slice
    let chosenSlice: (typeof wheelConfig.slices)[0];

    if (eligibleChoices.length === 0 || runningCumulative <= 0) {
      if (!fallbackSlice) {
        throw new ConflictException(
          'All slices are currently exhausted and no fallback slice was found',
        );
      }
      chosenSlice = fallbackSlice;
    } else {
      // Secure server randomness
      const randomWeight =
        crypto.randomInt(0, Math.floor(runningCumulative * 1000)) / 1000;
      const found = eligibleChoices.find(
        (c) => randomWeight < c.cumulativeUpper,
      );
      chosenSlice = found
        ? found.slice
        : eligibleChoices[eligibleChoices.length - 1].slice;
    }

    const isWin = !chosenSlice.isNoWin && chosenSlice.rewardId !== null;

    // 7. Atomic transaction in MySQL InnoDB with row lock and concurrent race recovery
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Verify participation is still SELECTED inside transaction
        const currentP = await tx.participation.findUnique({
          where: { id: participationId },
        });

        if (!currentP || currentP.status !== 'SELECTED') {
          throw new ConflictException(
            'Participation status changed concurrently. Spin aborted.',
          );
        }

        let selectedReward = chosenSlice.reward;

        // If winning slice requires limited inventory, atomically decrement
        if (
          isWin &&
          selectedReward &&
          selectedReward.inventoryMode === 'LIMITED'
        ) {
          // Atomic decrement with condition available_physical_stock > 0
          const updateRes = await tx.reward.updateMany({
            where: {
              id: selectedReward.id,
              availablePhysicalStock: { gt: 0 },
            },
            data: {
              availablePhysicalStock: { decrement: 1 },
            },
          });

          if (updateRes.count === 0) {
            // Race condition: physical stock was exhausted in parallel!
            // Safely downgrade to fallback slice
            if (fallbackSlice) {
              chosenSlice = fallbackSlice;
              selectedReward = fallbackSlice.reward;
            }
          } else {
            // Increment awarded quantity for today
            await tx.dailyAllocation.updateMany({
              where: {
                rewardId: selectedReward.id,
                exhibitionDayId: day.id,
              },
              data: {
                awardedQuantity: { increment: 1 },
              },
            });

            // Stock ledger entry
            const afterStock = await tx.reward.findUnique({
              where: { id: selectedReward.id },
              select: { availablePhysicalStock: true },
            });

            await tx.stockLedgerEntry.create({
              data: {
                rewardId: selectedReward.id,
                exhibitionDayId: day.id,
                entryType: 'SPIN_AWARD',
                quantityDelta: -1,
                balanceAfter: afterStock?.availablePhysicalStock || 0,
                referenceId: participation.readableRef,
                notes: `Awarded to ${participation.visitorName} (${participation.readableRef})`,
                createdBy: 'SYSTEM_SPIN_ENGINE',
              },
            });
          }
        }

        const isSpinAgain = this.isSpinAgainReward(chosenSlice);
        const finalIsWin = !chosenSlice.isNoWin && chosenSlice.rewardId !== null && !isSpinAgain;

        // Upsert SpinRecord so that re-spins update the record cleanly without violating unique constraints
        const spinRecord = await tx.spinRecord.upsert({
          where: { participationId: participation.id },
          create: {
            participationId: participation.id,
            exhibitionDayId: day.id,
            wheelConfigId: wheelConfig.id,
            wheelSliceId: chosenSlice.id,
            rewardId: chosenSlice.rewardId || null,
            sliceIndex: chosenSlice.sliceIndex,
            isWin: finalIsWin,
            idempotencyKey,
            status: isSpinAgain ? 'SELECTED' : 'COMPLETED',
            completedAt: isSpinAgain ? null : new Date(),
          },
          update: {
            exhibitionDayId: day.id,
            wheelConfigId: wheelConfig.id,
            wheelSliceId: chosenSlice.id,
            rewardId: chosenSlice.rewardId || null,
            sliceIndex: chosenSlice.sliceIndex,
            isWin: finalIsWin,
            idempotencyKey,
            status: isSpinAgain ? 'SELECTED' : 'COMPLETED',
            completedAt: isSpinAgain ? null : new Date(),
          },
          include: {
            reward: rewardWithMerchant,
            wheelSlice: true,
            participation: true,
          },
        });

        // If win, record Award
        if (finalIsWin && chosenSlice.rewardId) {
          await tx.award.create({
            data: {
              spinId: spinRecord.id,
              participationId: participation.id,
              rewardId: chosenSlice.rewardId,
              exhibitionDayId: day.id,
              status: 'AWARDED',
            },
          });
        }

        // If NOT a spin-again, mark participation as COMPLETED. If spin-again, keep it in SELECTED so the user can spin again!
        if (!isSpinAgain) {
          await tx.participation.update({
            where: { id: participation.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });
        } else {
          await this.auditService.log({
            action: 'BONUS_SPIN_AWARDED',
            resourceType: 'Participation',
            resourceId: participation.id,
            payload: {
              readableRef: participation.readableRef,
              visitorName: participation.visitorName,
              sliceIndex: chosenSlice.sliceIndex,
              sliceLabel: chosenSlice.label,
            },
          });
        }

        this.logger.log(
          `Spin executed for ${participation.readableRef}: Slice ${chosenSlice.sliceIndex} (${chosenSlice.label}), Win: ${finalIsWin}, SpinAgain: ${isSpinAgain}`,
        );

        return this.formatSpinResponse(spinRecord, false);
      });
    } catch (err: any) {
      // Concurrency recovery: If a duplicate or parallel transaction committed first, return existing spin
      const existingSpin = await this.prisma.spinRecord.findFirst({
        where: {
          OR: [{ idempotencyKey }, { participationId }],
        },
        include: {
          reward: rewardWithMerchant,
          wheelSlice: true,
          participation: true,
        },
      });

      if (existingSpin) {
        this.logger.log(
          `Concurrent race resolved: returning committed spin for key ${idempotencyKey}`,
        );
        return this.formatSpinResponse(existingSpin, true);
      }

      throw err;
    }
  }

  /**
   * Safe crash recovery snapshot: get spin record for participation.
   */
  async getSpinByParticipationId(participationId: string) {
    const spin = await this.prisma.spinRecord.findUnique({
      where: { participationId },
      include: {
        reward: rewardWithMerchant,
        wheelSlice: true,
        participation: true,
      },
    });

    if (!spin) {
      throw new NotFoundException(
        `No spin record found for participation ${participationId}`,
      );
    }

    return this.formatSpinResponse(spin, true);
  }

  private isSpinAgainReward(slice: any): boolean {
    if (!slice) return false;
    const sliceLabel = (slice.label || '').toLowerCase();
    const rewardName = (slice.reward?.name || '').toLowerCase();
    const shortLabel = (slice.reward?.shortLabel || '').toLowerCase();

    return (
      sliceLabel.includes('spin again') ||
      sliceLabel.includes('bonus spin') ||
      sliceLabel.includes('extra spin') ||
      sliceLabel.includes('another chance') ||
      rewardName.includes('spin again') ||
      rewardName.includes('bonus spin') ||
      rewardName.includes('extra spin') ||
      rewardName.includes('another chance') ||
      shortLabel.includes('spin again') ||
      shortLabel.includes('bonus spin')
    );
  }

  private formatSpinResponse(spin: any, isReplay: boolean) {
    const isSpinAgain = this.isSpinAgainReward(
      spin.wheelSlice || { label: spin.wheelSlice?.label, reward: spin.reward },
    );

    return {
      spinId: spin.id,
      participationId: spin.participationId,
      readableRef: spin.participation?.readableRef || null,
      visitorName: spin.participation?.visitorName || null,
      sliceIndex: spin.sliceIndex,
      sliceLabel: spin.wheelSlice?.label || null,
      isWin: spin.isWin,
      isSpinAgain,
      reward: spin.reward
        ? {
            id: spin.reward.id,
            name: spin.reward.name,
            description: spin.reward.description ?? null,
            shortLabel: spin.reward.shortLabel,
            type: spin.reward.type,
            colorHex: spin.reward.colorHex,
            iconUrl: spin.reward.iconUrl,
            videoUrl: spin.reward.videoUrl ?? null,
            isVideoShow: spin.reward.isVideoShow ?? false,
            merchant: spin.reward.merchant ?? null,
          }
        : null,
      completedAt: spin.completedAt,
      isReplay,
    };
  }
}
