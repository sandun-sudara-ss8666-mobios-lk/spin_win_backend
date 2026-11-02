import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateDayDto } from './dto/create-exhibition.dto';

@Injectable()
export class ExhibitionsService {
  private readonly logger = new Logger(ExhibitionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getActiveExhibition() {
    let exhibition = await this.prisma.exhibition.findFirst({
      where: { isActive: true },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!exhibition) {
      // Fallback: get any exhibition or null
      exhibition = await this.prisma.exhibition.findFirst({
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
          },
        },
      });
    }

    return exhibition;
  }

  async getDayById(dayId: string) {
    const day = await this.prisma.exhibitionDay.findUnique({
      where: { id: dayId },
      include: {
        exhibition: true,
      },
    });

    if (!day) {
      throw new NotFoundException(`Exhibition day with ID ${dayId} not found`);
    }

    return day;
  }

  async getActiveDay(exhibitionId?: string) {
    return this.prisma.exhibitionDay.findFirst({
      where: {
        status: 'IN_PROGRESS',
        ...(exhibitionId ? { exhibitionId } : {}),
      },
      include: {
        exhibition: true,
      },
    });
  }

  async startDay(dayId: string, userId?: string, userEmail?: string) {
    const day = await this.getDayById(dayId);

    // Idempotent check
    if (day.status === 'IN_PROGRESS') {
      return {
        message: 'Day is already in progress',
        day,
      };
    }

    if (day.status === 'COMPLETED') {
      throw new BadRequestException('Cannot start a completed exhibition day');
    }

    // Check if another day is currently IN_PROGRESS
    const existingActive = await this.prisma.exhibitionDay.findFirst({
      where: {
        exhibitionId: day.exhibitionId,
        status: 'IN_PROGRESS',
        id: { not: day.id },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        `Cannot start Day ${day.dayNumber}. Day ${existingActive.dayNumber} is currently IN_PROGRESS. Please end Day ${existingActive.dayNumber} first.`,
      );
    }

    const now = new Date();

    const updatedDay = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.exhibitionDay.update({
        where: { id: day.id },
        data: {
          status: 'IN_PROGRESS',
          actualStartedAt: day.actualStartedAt || now,
        },
        include: { exhibition: true },
      });

      return updated;
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'DAY_STARTED',
      resourceType: 'EXHIBITION_DAY',
      resourceId: day.id,
      payload: {
        dayNumber: day.dayNumber,
        label: day.label,
        actualStartedAt: updatedDay.actualStartedAt,
      },
    });

    this.logger.log(`Exhibition Day ${day.dayNumber} started successfully.`);
    return {
      message: `Day ${day.dayNumber} started successfully`,
      day: updatedDay,
    };
  }

  async endDay(dayId: string, userId?: string, userEmail?: string) {
    const day = await this.getDayById(dayId);

    // Idempotent check
    if (day.status === 'COMPLETED') {
      return {
        message: 'Day is already completed',
        day,
      };
    }

    if (day.status === 'UPCOMING') {
      throw new BadRequestException(
        'Cannot end an upcoming day that has not started',
      );
    }

    // Check for in-flight spins (STARTING or ANIMATING)
    const inFlightSpin = await this.prisma.spinRecord.findFirst({
      where: {
        exhibitionDayId: day.id,
        status: { in: ['STARTING', 'ANIMATING'] },
      },
    });

    if (inFlightSpin) {
      throw new ConflictException(
        'An active spin is currently in progress. Please wait for the spin animation to resolve before ending the day.',
      );
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Close all waiting/selected/skipped participations into DAY_CLOSED
      const closedParticipations = await tx.participation.updateMany({
        where: {
          exhibitionDayId: day.id,
          status: { in: ['WAITING', 'SELECTED', 'SKIPPED'] },
        },
        data: {
          status: 'DAY_CLOSED',
        },
      });

      // 2. Finalize daily allocations and calculate carry-forward
      const nextDay = await tx.exhibitionDay.findFirst({
        where: {
          exhibitionId: day.exhibitionId,
          dayNumber: day.dayNumber + 1,
        },
      });

      const todayAllocations = await tx.dailyAllocation.findMany({
        where: { exhibitionDayId: day.id },
        include: { reward: true },
      });

      for (const alloc of todayAllocations) {
        const totalAvailableToday =
          alloc.allocatedQuantity + alloc.carriedForwardQuantity;
        const unusedToday = Math.max(
          0,
          totalAvailableToday - alloc.awardedQuantity,
        );

        // Mark today finalized
        await tx.dailyAllocation.update({
          where: { id: alloc.id },
          data: { isFinalized: true },
        });

        // If carry forward is enabled and next day exists, transfer unused to next day
        if (alloc.reward.carryForward && nextDay && unusedToday > 0) {
          await tx.dailyAllocation.upsert({
            where: {
              rewardId_exhibitionDayId: {
                rewardId: alloc.rewardId,
                exhibitionDayId: nextDay.id,
              },
            },
            create: {
              rewardId: alloc.rewardId,
              exhibitionDayId: nextDay.id,
              allocatedQuantity: 0,
              carriedForwardQuantity: unusedToday,
              awardedQuantity: 0,
            },
            update: {
              carriedForwardQuantity: unusedToday,
            },
          });

          await tx.stockLedgerEntry.create({
            data: {
              rewardId: alloc.rewardId,
              exhibitionDayId: nextDay.id,
              entryType: 'CARRY_FORWARD_APPLIED',
              quantityDelta: unusedToday,
              balanceAfter: alloc.reward.availablePhysicalStock,
              referenceId: day.id,
              notes: `Carried forward ${unusedToday} unused units from Day ${day.dayNumber} to Day ${nextDay.dayNumber}`,
              createdBy: userEmail || 'SYSTEM',
            },
          });
        }
      }

      // 3. Mark day COMPLETED
      const updatedDay = await tx.exhibitionDay.update({
        where: { id: day.id },
        data: {
          status: 'COMPLETED',
          actualEndedAt: now,
        },
        include: { exhibition: true },
      });

      return { updatedDay, closedCount: closedParticipations.count };
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'DAY_ENDED',
      resourceType: 'EXHIBITION_DAY',
      resourceId: day.id,
      payload: {
        dayNumber: day.dayNumber,
        actualEndedAt: now,
        closedParticipations: result.closedCount,
      },
    });

    this.logger.log(
      `Exhibition Day ${day.dayNumber} ended. ${result.closedCount} waiting participations marked DAY_CLOSED.`,
    );

    return {
      message: `Day ${day.dayNumber} ended successfully`,
      day: result.updatedDay,
      closedParticipationsCount: result.closedCount,
    };
  }

  async setPauseStatus(
    exhibitionId: string,
    isPaused: boolean,
    userId?: string,
    userEmail?: string,
  ) {
    const exhibition = await this.prisma.exhibition.findUnique({
      where: { id: exhibitionId },
    });

    if (!exhibition) {
      throw new NotFoundException(
        `Exhibition with ID ${exhibitionId} not found`,
      );
    }

    const updated = await this.prisma.exhibition.update({
      where: { id: exhibitionId },
      data: { isPaused },
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: isPaused ? 'EXHIBITION_PAUSED' : 'EXHIBITION_RESUMED',
      resourceType: 'EXHIBITION',
      resourceId: exhibition.id,
      payload: { isPaused },
    });

    return updated;
  }

  async updateDay(
    dayId: string,
    dto: UpdateDayDto,
    userId?: string,
    userEmail?: string,
  ) {
    const day = await this.getDayById(dayId);

    const updated = await this.prisma.exhibitionDay.update({
      where: { id: day.id },
      data: {
        label: dto.label || day.label,
        pacingStartTime: dto.pacingStartTime || day.pacingStartTime,
        pacingEndTime: dto.pacingEndTime || day.pacingEndTime,
      },
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'DAY_UPDATED',
      resourceType: 'EXHIBITION_DAY',
      resourceId: day.id,
      payload: dto,
    });

    return updated;
  }
}
