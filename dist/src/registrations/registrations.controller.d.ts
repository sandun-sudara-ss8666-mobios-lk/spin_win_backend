import { RegistrationsService } from './registrations.service';
import { RegisterVisitorDto, QueryQueueDto } from './dto/register-visitor.dto';
export declare class RegistrationsController {
    private readonly registrationsService;
    constructor(registrationsService: RegistrationsService);
    register(dto: RegisterVisitorDto): Promise<{
        reference: string;
        visitorName: string;
        registeredAt: Date;
        message: string;
    }>;
    getQueue(query: QueryQueueDto): Promise<{
        data: {
            id: string;
            readableRef: string;
            visitorName: string;
            visitorPhone: string;
            visitorPhoneMasked: string;
            status: import(".prisma/client").$Enums.ParticipationStatus;
            registeredAt: Date;
            selectedAt: Date | null;
            completedAt: Date | null;
            spin: {
                id: string;
                isWin: boolean;
                status: import(".prisma/client").$Enums.SpinStatus;
                sliceIndex: number;
                reward: {
                    id: string;
                    name: string;
                    type: import(".prisma/client").$Enums.RewardType;
                    shortLabel: string;
                } | null;
            } | null;
            repeatStats: {
                isRepeatVisitor: boolean;
                totalRegistrations: number;
                totalWins: number;
            };
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
            activeDayNumber: number | null;
        };
    }>;
    getById(id: string): Promise<{
        exhibitionDay: {
            id: string;
            status: import(".prisma/client").$Enums.DayStatus;
            createdAt: Date;
            updatedAt: Date;
            exhibitionId: string;
            dayNumber: number;
            date: string;
            label: string;
            actualStartedAt: Date | null;
            actualEndedAt: Date | null;
            pacingStartTime: string;
            pacingEndTime: string;
        };
        spin: ({
            reward: {
                id: string;
                createdAt: Date;
                name: string;
                merchantId: string | null;
                description: string | null;
                type: import(".prisma/client").$Enums.RewardType;
                shortLabel: string;
                inventoryMode: import(".prisma/client").$Enums.InventoryMode;
                distributionStrategy: import(".prisma/client").$Enums.DistributionStrategy;
                totalPhysicalStock: number;
                availablePhysicalStock: number;
                retiredStock: number;
                carryForward: boolean;
                isActive: boolean;
                effectiveStartAt: Date | null;
                baselineWeight: number;
                colorHex: string | null;
                iconUrl: string | null;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            status: import(".prisma/client").$Enums.SpinStatus;
            completedAt: Date | null;
            exhibitionDayId: string;
            createdAt: Date;
            participationId: string;
            wheelConfigId: string;
            wheelSliceId: string;
            rewardId: string | null;
            sliceIndex: number;
            isWin: boolean;
            idempotencyKey: string;
            startedAt: Date;
        }) | null;
    } & {
        visitorName: string;
        registeredAt: Date;
        id: string;
        readableRef: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        selectedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        exhibitionDayId: string;
        regSessionId: string | null;
    }>;
    select(id: string): Promise<{
        visitorName: string;
        registeredAt: Date;
        id: string;
        readableRef: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        selectedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        exhibitionDayId: string;
        regSessionId: string | null;
    }>;
    skip(id: string): Promise<{
        visitorName: string;
        registeredAt: Date;
        id: string;
        readableRef: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        selectedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        exhibitionDayId: string;
        regSessionId: string | null;
    }>;
    requeue(id: string): Promise<{
        visitorName: string;
        registeredAt: Date;
        id: string;
        readableRef: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        selectedAt: Date | null;
        completedAt: Date | null;
        notes: string | null;
        exhibitionDayId: string;
        regSessionId: string | null;
    }>;
}
