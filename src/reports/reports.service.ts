import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const activeDay = await this.prisma.exhibitionDay.findFirst({
      where: { status: 'IN_PROGRESS' },
      include: { exhibition: true },
    });

    const [
      totalRegistrationsAllTime,
      totalRegistrationsToday,
      waitingQueueCount,
      totalSpinsAllTime,
      totalSpinsToday,
      totalWinsToday,
      rewardsCount,
      awardsByReward,
    ] = await Promise.all([
      this.prisma.participation.count(),
      activeDay
        ? this.prisma.participation.count({
            where: { exhibitionDayId: activeDay.id },
          })
        : 0,
      activeDay
        ? this.prisma.participation.count({
            where: { exhibitionDayId: activeDay.id, status: 'WAITING' },
          })
        : 0,
      this.prisma.spinRecord.count(),
      activeDay
        ? this.prisma.spinRecord.count({
            where: { exhibitionDayId: activeDay.id },
          })
        : 0,
      activeDay
        ? this.prisma.spinRecord.count({
            where: { exhibitionDayId: activeDay.id, isWin: true },
          })
        : 0,
      this.prisma.reward.count({ where: { isActive: true } }),
      this.prisma.award.groupBy({
        by: ['rewardId'],
        where: {
          status: 'AWARDED',
          ...(activeDay ? { exhibitionDayId: activeDay.id } : {}),
        },
        _count: { id: true },
      }),
    ]);

    // Fetch reward names for top awards
    const rewardIds = awardsByReward.map((a) => a.rewardId);
    const rewards = await this.prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, name: true, shortLabel: true, type: true },
    });

    const rewardMap = new Map(rewards.map((r) => [r.id, r]));

    const topPrizes = awardsByReward
      .map((a) => ({
        rewardId: a.rewardId,
        rewardName: rewardMap.get(a.rewardId)?.name || 'Unknown',
        shortLabel: rewardMap.get(a.rewardId)?.shortLabel || 'Unknown',
        type: rewardMap.get(a.rewardId)?.type || 'PHYSICAL',
        count: a._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const winRateToday =
      totalSpinsToday > 0
        ? Math.round((totalWinsToday / totalSpinsToday) * 1000) / 10
        : 0;

    return {
      activeDay: activeDay
        ? {
            id: activeDay.id,
            dayNumber: activeDay.dayNumber,
            label: activeDay.label,
            status: activeDay.status,
            actualStartedAt: activeDay.actualStartedAt,
            pacingStartTime: activeDay.pacingStartTime,
            pacingEndTime: activeDay.pacingEndTime,
            isPaused: activeDay.exhibition.isPaused,
          }
        : null,
      kpis: {
        totalRegistrationsAllTime,
        totalRegistrationsToday,
        waitingQueueCount,
        totalSpinsAllTime,
        totalSpinsToday,
        totalWinsToday,
        winRatePercent: winRateToday,
        activeRewardsCount: rewardsCount,
      },
      topPrizesToday: topPrizes.slice(0, 5),
    };
  }

  async getSummaryReport(dayId?: string) {
    const whereDay = dayId ? { id: dayId } : undefined;
    const days = await this.prisma.exhibitionDay.findMany({
      where: whereDay,
      orderBy: { dayNumber: 'asc' },
      include: {
        _count: {
          select: {
            participations: true,
            spins: true,
            awards: true,
          },
        },
        dailyAllocations: {
          include: {
            reward: true,
          },
        },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      days: days.map((d) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        label: d.label,
        status: d.status,
        actualStartedAt: d.actualStartedAt,
        actualEndedAt: d.actualEndedAt,
        totalParticipations: d._count.participations,
        totalSpins: d._count.spins,
        totalAwards: d._count.awards,
        allocations: d.dailyAllocations.map((a) => ({
          rewardName: a.reward.name,
          allocated: a.allocatedQuantity,
          carriedForward: a.carriedForwardQuantity,
          awarded: a.awardedQuantity,
          remaining: Math.max(
            0,
            a.allocatedQuantity + a.carriedForwardQuantity - a.awardedQuantity,
          ),
        })),
      })),
    };
  }
}
