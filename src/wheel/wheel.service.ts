import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PacingCalculator } from '../common/utils/pacing.calculator';
import {
  PriorityCurveCalculator,
  SliceWeightInfo,
} from '../common/utils/priority-curve.calculator';
import {
  CreateWheelConfigDto,
  CreatePriorityListDto,
} from './dto/create-wheel-config.dto';

@Injectable()
export class WheelService {
  private readonly logger = new Logger(WheelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Public/Wheel display snapshot of active wheel configuration.
   * Strips out backend odds, priority rank, and remaining stock to maintain client privacy.
   */
  async getActiveWheelDisplayConfig() {
    const config = await this.prisma.wheelConfig.findFirst({
      where: { isPublished: true },
      include: {
        slices: {
          orderBy: { sliceIndex: 'asc' },
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                description: true,
                shortLabel: true,
                type: true,
                colorHex: true,
                iconUrl: true,
                videoUrl: true,
                isVideoShow: true,
                merchant: {
                  select: { name: true, logoUrl: true, primaryColor: true },
                },
              },
            },
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException('No published wheel configuration found');
    }

    return {
      version: config.version,
      name: config.name,
      sliceCount: config.sliceCount,
      slices: config.slices.map((s) => ({
        id: s.id,
        sliceIndex: s.sliceIndex,
        label: s.label,
        backgroundColor: s.backgroundColor,
        textColor: s.textColor,
        iconUrl: s.iconUrl || s.reward?.iconUrl || null,
        isNoWin: s.isNoWin,
        rewardId: s.reward?.id || null,
        description: s.reward?.description || null,
        videoUrl: s.reward?.videoUrl || null,
        isVideoShow: s.reward?.isVideoShow ?? false,
        merchant: s.reward?.merchant || null,
      })),
    };
  }

  async getAllConfigs() {
    return this.prisma.wheelConfig.findMany({
      orderBy: { version: 'desc' },
      include: {
        slices: {
          orderBy: { sliceIndex: 'asc' },
          include: { reward: true },
        },
      },
    });
  }

  async createDraftConfig(
    dto: CreateWheelConfigDto,
    userId?: string,
    userEmail?: string,
  ) {
    if (dto.slices.length !== dto.sliceCount) {
      throw new BadRequestException(
        `Number of provided slices (${dto.slices.length}) must match sliceCount (${dto.sliceCount})`,
      );
    }

    const indices = dto.slices.map((s) => s.sliceIndex).sort((a, b) => a - b);
    for (let i = 0; i < dto.sliceCount; i++) {
      if (indices[i] !== i) {
        throw new BadRequestException(
          `Slices must have contiguous indices from 0 to ${dto.sliceCount - 1}`,
        );
      }
    }

    // Determine next version number
    const highest = await this.prisma.wheelConfig.findFirst({
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (highest?.version || 0) + 1;

    const config = await this.prisma.wheelConfig.create({
      data: {
        version: nextVersion,
        name: dto.name.trim(),
        sliceCount: dto.sliceCount,
        isPublished: false,
        createdBy: userEmail || 'ADMIN',
        slices: {
          create: dto.slices.map((s) => ({
            sliceIndex: s.sliceIndex,
            rewardId: s.rewardId || null,
            isNoWin: s.isNoWin || false,
            label: s.label.trim(),
            backgroundColor: s.backgroundColor,
            textColor: s.textColor,
            iconUrl: s.iconUrl || null,
          })),
        },
      },
      include: {
        slices: {
          orderBy: { sliceIndex: 'asc' },
          include: { reward: true },
        },
      },
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'WHEEL_CONFIG_CREATED',
      resourceType: 'WHEEL_CONFIG',
      resourceId: config.id,
      payload: {
        version: config.version,
        name: config.name,
        sliceCount: config.sliceCount,
      },
    });

    return config;
  }

  /**
   * Publishes wheel config with strict fallback outcome verification.
   */
  async publishConfig(configId: string, userId?: string, userEmail?: string) {
    const config = await this.prisma.wheelConfig.findUnique({
      where: { id: configId },
      include: {
        slices: {
          include: { reward: true },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(`Wheel config with ID ${configId} not found`);
    }

    // Verify fallback guarantee: at least one slice must be NO_WIN or UNLIMITED
    let hasFallback = false;
    for (const slice of config.slices) {
      if (slice.isNoWin) {
        hasFallback = true;
        break;
      }
      if (
        slice.reward &&
        (slice.reward.inventoryMode === 'UNLIMITED' ||
          slice.reward.inventoryMode === 'NO_WIN')
      ) {
        hasFallback = true;
        break;
      }
    }

    if (!hasFallback) {
      throw new BadRequestException(
        'Cannot publish wheel configuration: at least one positive-weight fallback outcome (UNLIMITED reward or NO_WIN) is required to prevent deadlocks when limited inventory is exhausted.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Unpublish existing
      await tx.wheelConfig.updateMany({
        where: { isPublished: true },
        data: { isPublished: false },
      });

      // Publish this config
      return tx.wheelConfig.update({
        where: { id: configId },
        data: { isPublished: true },
        include: {
          slices: {
            orderBy: { sliceIndex: 'asc' },
            include: { reward: true },
          },
        },
      });
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'WHEEL_CONFIG_PUBLISHED',
      resourceType: 'WHEEL_CONFIG',
      resourceId: updated.id,
      payload: { version: updated.version, name: updated.name },
    });

    return updated;
  }

  // --- Priority Ranking Engine ---

  async createPriorityList(
    dto: CreatePriorityListDto,
    userId?: string,
    userEmail?: string,
  ) {
    // Validate rank continuity 1..N
    const n = dto.items.length;
    if (n === 0) {
      throw new BadRequestException(
        'Priority list must contain at least one ranked reward',
      );
    }

    const ranks = dto.items.map((i) => i.rank).sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
      if (ranks[i] !== i + 1) {
        throw new BadRequestException(
          `Priority ranks must be strictly contiguous from 1 to ${n}`,
        );
      }
    }

    // Validate reward IDs unique in list
    const rewardIds = new Set(dto.items.map((i) => i.rewardId));
    if (rewardIds.size !== n) {
      throw new BadRequestException(
        'Each reward can only be ranked once in a priority list',
      );
    }

    const list = await this.prisma.priorityList.create({
      data: {
        name: dto.name.trim(),
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            rewardId: item.rewardId,
            rank: item.rank,
            multiplier: PriorityCurveCalculator.getMultiplier(item.rank, n),
          })),
        },
      },
      include: {
        items: {
          orderBy: { rank: 'asc' },
          include: { reward: true },
        },
      },
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'PRIORITY_LIST_CREATED',
      resourceType: 'PRIORITY_LIST',
      resourceId: list.id,
      payload: { name: list.name, count: n },
    });

    return list;
  }

  async publishPriorityList(
    listId: string,
    userId?: string,
    userEmail?: string,
  ) {
    const list = await this.prisma.priorityList.findUnique({
      where: { id: listId },
      include: { items: true },
    });

    if (!list) {
      throw new NotFoundException(`Priority list with ID ${listId} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Inactivate other published lists
      await tx.priorityList.updateMany({
        where: { status: 'PUBLISHED' },
        data: { status: 'INACTIVE' },
      });

      return tx.priorityList.update({
        where: { id: listId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          version: { increment: 1 },
        },
        include: {
          items: {
            orderBy: { rank: 'asc' },
            include: { reward: true },
          },
        },
      });
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'PRIORITY_LIST_PUBLISHED',
      resourceType: 'PRIORITY_LIST',
      resourceId: updated.id,
      payload: { name: updated.name, version: updated.version },
    });

    return updated;
  }

  async deactivatePriorityList(
    listId: string,
    userId?: string,
    userEmail?: string,
  ) {
    const list = await this.prisma.priorityList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException(`Priority list with ID ${listId} not found`);
    }

    const updated = await this.prisma.priorityList.update({
      where: { id: listId },
      data: { status: 'INACTIVE' },
    });

    await this.auditService.log({
      userId,
      userEmail,
      action: 'PRIORITY_LIST_DEACTIVATED',
      resourceType: 'PRIORITY_LIST',
      resourceId: updated.id,
    });

    return updated;
  }

  async getAllPriorityLists() {
    return this.prisma.priorityList.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { rank: 'asc' },
          include: { reward: true },
        },
      },
    });
  }

  /**
   * Real-time Probability Preview for Admin.
   * Evaluates current active day, pacing release, hard stock, and active priority list.
   */
  async getProbabilityPreview() {
    const activeConfig = await this.prisma.wheelConfig.findFirst({
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

    if (!activeConfig) {
      throw new NotFoundException('No published wheel configuration found');
    }

    const activeDay = await this.prisma.exhibitionDay.findFirst({
      where: { status: 'IN_PROGRESS' },
    });

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
    const sliceWeightInfos: SliceWeightInfo[] = [];

    for (const slice of activeConfig.slices) {
      if (slice.isNoWin || !slice.reward) {
        sliceWeightInfos.push({
          sliceId: slice.id,
          sliceIndex: slice.sliceIndex,
          rewardId: null,
          label: slice.label,
          isNoWin: true,
          baselineWeight: 10, // Explicit positive baseline weight for fallback
          rank: null,
          isEligible: true,
        });
        continue;
      }

      const reward = slice.reward;
      let isEligible = reward.isActive;

      if (reward.inventoryMode === 'LIMITED') {
        if (reward.availablePhysicalStock <= 0) {
          isEligible = false;
        } else if (activeDay) {
          const allocation = reward.dailyAllocations.find(
            (a) => a.exhibitionDayId === activeDay.id,
          );
          const totalTarget =
            (allocation?.allocatedQuantity || 0) +
            (allocation?.carriedForwardQuantity || 0);
          const awarded = allocation?.awardedQuantity || 0;

          const refEnd = PacingCalculator.parseTimeStringOnDate(
            activeDay.date,
            activeDay.pacingEndTime,
          );
          const pacing = PacingCalculator.calculate({
            serverTime: now,
            dayActualStart: activeDay.actualStartedAt || now,
            referenceEnd: refEnd,
            dailyTargetAllocation: totalTarget,
            awardedToday: awarded,
            availablePhysicalStock: reward.availablePhysicalStock,
          });

          isEligible = pacing.eligibleForSpin;
        }
      }

      const rank = reward.id ? rankMap.get(reward.id) || null : null;

      sliceWeightInfos.push({
        sliceId: slice.id,
        sliceIndex: slice.sliceIndex,
        rewardId: reward.id,
        label: slice.label,
        isNoWin: false,
        baselineWeight: reward.baselineWeight || 3,
        rank,
        isEligible,
      });
    }

    const totalRanked = activePriorityList
      ? activePriorityList.items.length
      : 0;
    const previews = PriorityCurveCalculator.calculateProbabilities(
      sliceWeightInfos,
      totalRanked,
    );

    return {
      wheelVersion: activeConfig.version,
      activeDayNumber: activeDay?.dayNumber || null,
      activePriorityList: activePriorityList
        ? {
            id: activePriorityList.id,
            name: activePriorityList.name,
            version: activePriorityList.version,
          }
        : null,
      serverTime: now.toISOString(),
      slices: previews,
    };
  }
}
