import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateDayDto } from './dto/create-exhibition.dto';
export declare class ExhibitionsService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    getActiveExhibition(): Promise<({
        days: {
            id: string;
            pacingStartTime: string;
            pacingEndTime: string;
            createdAt: Date;
            updatedAt: Date;
            dayNumber: number;
            exhibitionId: string;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        timezone: string;
        isActive: boolean;
        isPaused: boolean;
        pacingStartTime: string;
        pacingEndTime: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    getDayById(dayId: string): Promise<{
        exhibition: {
            id: string;
            name: string;
            description: string | null;
            timezone: string;
            isActive: boolean;
            isPaused: boolean;
            pacingStartTime: string;
            pacingEndTime: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        pacingStartTime: string;
        pacingEndTime: string;
        createdAt: Date;
        updatedAt: Date;
        dayNumber: number;
        exhibitionId: string;
        date: string;
        label: string;
        status: import(".prisma/client").$Enums.DayStatus;
        actualStartedAt: Date | null;
        actualEndedAt: Date | null;
    }>;
    getActiveDay(exhibitionId?: string): Promise<({
        exhibition: {
            id: string;
            name: string;
            description: string | null;
            timezone: string;
            isActive: boolean;
            isPaused: boolean;
            pacingStartTime: string;
            pacingEndTime: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        pacingStartTime: string;
        pacingEndTime: string;
        createdAt: Date;
        updatedAt: Date;
        dayNumber: number;
        exhibitionId: string;
        date: string;
        label: string;
        status: import(".prisma/client").$Enums.DayStatus;
        actualStartedAt: Date | null;
        actualEndedAt: Date | null;
    }) | null>;
    startDay(dayId: string, userId?: string, userEmail?: string): Promise<{
        message: string;
        day: {
            exhibition: {
                id: string;
                name: string;
                description: string | null;
                timezone: string;
                isActive: boolean;
                isPaused: boolean;
                pacingStartTime: string;
                pacingEndTime: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            pacingStartTime: string;
            pacingEndTime: string;
            createdAt: Date;
            updatedAt: Date;
            dayNumber: number;
            exhibitionId: string;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        };
    }>;
    endDay(dayId: string, userId?: string, userEmail?: string): Promise<{
        message: string;
        day: {
            exhibition: {
                id: string;
                name: string;
                description: string | null;
                timezone: string;
                isActive: boolean;
                isPaused: boolean;
                pacingStartTime: string;
                pacingEndTime: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            pacingStartTime: string;
            pacingEndTime: string;
            createdAt: Date;
            updatedAt: Date;
            dayNumber: number;
            exhibitionId: string;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        };
        closedParticipationsCount?: undefined;
    } | {
        message: string;
        day: {
            exhibition: {
                id: string;
                name: string;
                description: string | null;
                timezone: string;
                isActive: boolean;
                isPaused: boolean;
                pacingStartTime: string;
                pacingEndTime: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            pacingStartTime: string;
            pacingEndTime: string;
            createdAt: Date;
            updatedAt: Date;
            dayNumber: number;
            exhibitionId: string;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        };
        closedParticipationsCount: number;
    }>;
    setPauseStatus(exhibitionId: string, isPaused: boolean, userId?: string, userEmail?: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        timezone: string;
        isActive: boolean;
        isPaused: boolean;
        pacingStartTime: string;
        pacingEndTime: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateDay(dayId: string, dto: UpdateDayDto, userId?: string, userEmail?: string): Promise<{
        id: string;
        pacingStartTime: string;
        pacingEndTime: string;
        createdAt: Date;
        updatedAt: Date;
        dayNumber: number;
        exhibitionId: string;
        date: string;
        label: string;
        status: import(".prisma/client").$Enums.DayStatus;
        actualStartedAt: Date | null;
        actualEndedAt: Date | null;
    }>;
}
