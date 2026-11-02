import { ReportsService } from './reports.service';
import { AuditService } from '../audit/audit.service';
export declare class ReportsController {
    private readonly reportsService;
    private readonly auditService;
    constructor(reportsService: ReportsService, auditService: AuditService);
    getDashboard(): Promise<{
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
    getSummary(dayId?: string): Promise<{
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
    getAuditLogs(limit?: number, action?: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userEmail: string | null;
        action: string;
        resourceType: string;
        resourceId: string | null;
        payload: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string | null;
    })[]>;
}
