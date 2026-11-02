import { MerchantsService } from './merchants.service';
import { CreateMerchantDto, UpdateMerchantDto } from './dto/create-merchant.dto';
export declare class MerchantsController {
    private readonly merchantsService;
    constructor(merchantsService: MerchantsService);
    create(dto: CreateMerchantDto, userId: string, userEmail: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        primaryColor: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
    }>;
    findAll(all?: string): Promise<({
        _count: {
            rewards: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        primaryColor: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
    })[]>;
    findOne(id: string): Promise<{
        rewards: {
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
        }[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        primaryColor: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
    }>;
    update(id: string, dto: UpdateMerchantDto, userId: string, userEmail: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        primaryColor: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
    }>;
    remove(id: string, userId: string, userEmail: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        primaryColor: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
    }>;
}
