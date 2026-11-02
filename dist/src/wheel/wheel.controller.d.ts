import { WheelService } from './wheel.service';
import { CreateWheelConfigDto, CreatePriorityListDto } from './dto/create-wheel-config.dto';
export declare class WheelController {
    private readonly wheelService;
    constructor(wheelService: WheelService);
    getActiveWheel(): Promise<{
        version: number;
        name: string;
        sliceCount: number;
        slices: {
            id: string;
            sliceIndex: number;
            label: string;
            backgroundColor: string;
            textColor: string;
            iconUrl: string | null;
            isNoWin: boolean;
            merchant: {
                name: string;
                logoUrl: string | null;
                primaryColor: string | null;
            } | null;
        }[];
    }>;
    getProbabilityPreview(): Promise<{
        wheelVersion: number;
        activeDayNumber: number | null;
        activePriorityList: {
            id: string;
            name: string;
            version: number;
        } | null;
        serverTime: string;
        slices: import("../common/utils/priority-curve.calculator").SliceProbabilityPreview[];
    }>;
    getAllConfigs(): Promise<({
        slices: ({
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
            label: string;
            iconUrl: string | null;
            rewardId: string | null;
            sliceIndex: number;
            isNoWin: boolean;
            backgroundColor: string;
            textColor: string;
            wheelConfigId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        version: number;
        isPublished: boolean;
        sliceCount: number;
    })[]>;
    createConfig(dto: CreateWheelConfigDto, userId: string, userEmail: string): Promise<{
        slices: ({
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
            label: string;
            iconUrl: string | null;
            rewardId: string | null;
            sliceIndex: number;
            isNoWin: boolean;
            backgroundColor: string;
            textColor: string;
            wheelConfigId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        version: number;
        isPublished: boolean;
        sliceCount: number;
    }>;
    publishConfig(configId: string, userId: string, userEmail: string): Promise<{
        slices: ({
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
            label: string;
            iconUrl: string | null;
            rewardId: string | null;
            sliceIndex: number;
            isNoWin: boolean;
            backgroundColor: string;
            textColor: string;
            wheelConfigId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        version: number;
        isPublished: boolean;
        sliceCount: number;
    }>;
    getAllPriorityLists(): Promise<({
        items: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            rewardId: string;
            rank: number;
            multiplier: number;
            priorityListId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PriorityListStatus;
        version: number;
        publishedAt: Date | null;
    })[]>;
    createPriorityList(dto: CreatePriorityListDto, userId: string, userEmail: string): Promise<{
        items: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            rewardId: string;
            rank: number;
            multiplier: number;
            priorityListId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PriorityListStatus;
        version: number;
        publishedAt: Date | null;
    }>;
    publishPriorityList(id: string, userId: string, userEmail: string): Promise<{
        items: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            rewardId: string;
            rank: number;
            multiplier: number;
            priorityListId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PriorityListStatus;
        version: number;
        publishedAt: Date | null;
    }>;
    deactivatePriorityList(id: string, userId: string, userEmail: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PriorityListStatus;
        version: number;
        publishedAt: Date | null;
    }>;
}
