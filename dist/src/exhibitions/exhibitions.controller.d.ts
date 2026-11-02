import { ExhibitionsService } from './exhibitions.service';
import { UpdateDayDto } from './dto/create-exhibition.dto';
export declare class ExhibitionsController {
    private readonly exhibitionsService;
    constructor(exhibitionsService: ExhibitionsService);
    getCurrentExhibition(): Promise<({
        days: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pacingStartTime: string;
            pacingEndTime: string;
            exhibitionId: string;
            dayNumber: number;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        }[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timezone: string;
        isPaused: boolean;
        pacingStartTime: string;
        pacingEndTime: string;
    }) | null>;
    getActiveDay(): Promise<({
        exhibition: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            timezone: string;
            isPaused: boolean;
            pacingStartTime: string;
            pacingEndTime: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pacingStartTime: string;
        pacingEndTime: string;
        exhibitionId: string;
        dayNumber: number;
        date: string;
        label: string;
        status: import(".prisma/client").$Enums.DayStatus;
        actualStartedAt: Date | null;
        actualEndedAt: Date | null;
    }) | null>;
    getDayById(dayId: string): Promise<{
        exhibition: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            timezone: string;
            isPaused: boolean;
            pacingStartTime: string;
            pacingEndTime: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pacingStartTime: string;
        pacingEndTime: string;
        exhibitionId: string;
        dayNumber: number;
        date: string;
        label: string;
        status: import(".prisma/client").$Enums.DayStatus;
        actualStartedAt: Date | null;
        actualEndedAt: Date | null;
    }>;
    startDay(dayId: string, userId: string, userEmail: string): Promise<{
        message: string;
        day: {
            exhibition: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                timezone: string;
                isPaused: boolean;
                pacingStartTime: string;
                pacingEndTime: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pacingStartTime: string;
            pacingEndTime: string;
            exhibitionId: string;
            dayNumber: number;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        };
    }>;
    endDay(dayId: string, userId: string, userEmail: string): Promise<{
        message: string;
        day: {
            exhibition: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                timezone: string;
                isPaused: boolean;
                pacingStartTime: string;
                pacingEndTime: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pacingStartTime: string;
            pacingEndTime: string;
            exhibitionId: string;
            dayNumber: number;
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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                timezone: string;
                isPaused: boolean;
                pacingStartTime: string;
                pacingEndTime: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pacingStartTime: string;
            pacingEndTime: string;
            exhibitionId: string;
            dayNumber: number;
            date: string;
            label: string;
            status: import(".prisma/client").$Enums.DayStatus;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
        };
        closedParticipationsCount: number;
    }>;
    updateDay(dayId: string, dto: UpdateDayDto, userId: string, userEmail: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pacingStartTime: string;
        pacingEndTime: string;
        exhibitionId: string;
        dayNumber: number;
        date: string;
        label: string;
        status: import(".prisma/client").$Enums.DayStatus;
        actualStartedAt: Date | null;
        actualEndedAt: Date | null;
    }>;
    pauseExhibition(exhibitionId: string, userId: string, userEmail: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timezone: string;
        isPaused: boolean;
        pacingStartTime: string;
        pacingEndTime: string;
    }>;
    resumeExhibition(exhibitionId: string, userId: string, userEmail: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timezone: string;
        isPaused: boolean;
        pacingStartTime: string;
        pacingEndTime: string;
    }>;
}
