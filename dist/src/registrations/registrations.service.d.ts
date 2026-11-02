import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterVisitorDto, QueryQueueDto } from './dto/register-visitor.dto';
export declare class RegistrationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private generateReadableRef;
    registerVisitor(dto: RegisterVisitorDto): Promise<{
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
    getParticipationById(id: string): Promise<{
        exhibitionDay: {
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
        spin: ({
            reward: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                merchantId: string | null;
                type: import(".prisma/client").$Enums.RewardType;
                shortLabel: string;
                inventoryMode: import(".prisma/client").$Enums.InventoryMode;
                distributionStrategy: import(".prisma/client").$Enums.DistributionStrategy;
                totalPhysicalStock: number;
                availablePhysicalStock: number;
                retiredStock: number;
                carryForward: boolean;
                effectiveStartAt: Date | null;
                baselineWeight: number;
                colorHex: string | null;
                iconUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SpinStatus;
            rewardId: string | null;
            exhibitionDayId: string;
            sliceIndex: number;
            completedAt: Date | null;
            participationId: string;
            wheelConfigId: string;
            wheelSliceId: string;
            isWin: boolean;
            idempotencyKey: string;
            startedAt: Date;
        }) | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        notes: string | null;
        exhibitionDayId: string;
        readableRef: string;
        visitorName: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        registeredAt: Date;
        selectedAt: Date | null;
        completedAt: Date | null;
        regSessionId: string | null;
    }>;
    selectParticipation(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        notes: string | null;
        exhibitionDayId: string;
        readableRef: string;
        visitorName: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        registeredAt: Date;
        selectedAt: Date | null;
        completedAt: Date | null;
        regSessionId: string | null;
    }>;
    skipParticipation(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        notes: string | null;
        exhibitionDayId: string;
        readableRef: string;
        visitorName: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        registeredAt: Date;
        selectedAt: Date | null;
        completedAt: Date | null;
        regSessionId: string | null;
    }>;
    requeueParticipation(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ParticipationStatus;
        notes: string | null;
        exhibitionDayId: string;
        readableRef: string;
        visitorName: string;
        visitorPhone: string;
        visitorPhoneRaw: string;
        registeredAt: Date;
        selectedAt: Date | null;
        completedAt: Date | null;
        regSessionId: string | null;
    }>;
}
