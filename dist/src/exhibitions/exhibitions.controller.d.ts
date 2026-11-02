import { ExhibitionsService } from './exhibitions.service';
import { UpdateDayDto } from './dto/create-exhibition.dto';
export declare class ExhibitionsController {
    private readonly exhibitionsService;
    constructor(exhibitionsService: ExhibitionsService);
    getCurrentExhibition(): Promise<({
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
    getActiveDay(): Promise<({
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
    startDay(dayId: string, userId: string, userEmail: string): Promise<{
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
    endDay(dayId: string, userId: string, userEmail: string): Promise<{
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
    updateDay(dayId: string, dto: UpdateDayDto, userId: string, userEmail: string): Promise<{
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
    pauseExhibition(exhibitionId: string, userId: string, userEmail: string): Promise<{
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
    resumeExhibition(exhibitionId: string, userId: string, userEmail: string): Promise<{
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
}
