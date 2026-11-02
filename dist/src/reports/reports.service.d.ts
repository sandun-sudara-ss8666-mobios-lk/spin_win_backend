import { PrismaService } from '../common/prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardSummary(): Promise<{
        activeDay: {
            id: string;
            dayNumber: number;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            pacingStartTime: string;
            pacingEndTime: string;
            isPaused: boolean;
        } | null;
        kpis: {
            totalRegistrationsAllTime: number;
            totalRegistrationsToday: number;
            waitingQueueCount: number;
            totalSpinsAllTime: number;
            totalSpinsToday: number;
            totalWinsToday: number;
            winRatePercent: number;
            activeRewardsCount: number;
        };
        topPrizesToday: {
            rewardId: string;
            rewardName: string;
            shortLabel: string;
            type: import(".prisma/client").$Enums.RewardType;
            count: number;
        }[];
    }>;
    getSummaryReport(dayId?: string): Promise<{
        generatedAt: string;
        days: {
            id: string;
            dayNumber: number;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
            totalParticipations: number;
            totalSpins: number;
            totalAwards: number;
            allocations: {
                rewardName: string;
                allocated: number;
                carriedForward: number;
                awarded: number;
                remaining: number;
            }[];
        }[];
    }>;
}
