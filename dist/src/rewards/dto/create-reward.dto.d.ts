export declare enum RewardTypeEnum {
    PHYSICAL = "PHYSICAL",
    VOUCHER = "VOUCHER",
    MERCHANDISE = "MERCHANDISE",
    NO_WIN = "NO_WIN"
}
export declare enum InventoryModeEnum {
    LIMITED = "LIMITED",
    UNLIMITED = "UNLIMITED",
    NO_WIN = "NO_WIN"
}
export declare enum DistributionStrategyEnum {
    EXHIBITION_WIDE = "EXHIBITION_WIDE",
    AUTO_DAILY = "AUTO_DAILY",
    CUSTOM_DAILY = "CUSTOM_DAILY"
}
export declare class CreateRewardDto {
    merchantId?: string;
    name: string;
    description?: string;
    type: RewardTypeEnum;
    shortLabel: string;
    inventoryMode: InventoryModeEnum;
    distributionStrategy: DistributionStrategyEnum;
    totalPhysicalStock: number;
    carryForward?: boolean;
    baselineWeight?: number;
    colorHex?: string;
    iconUrl?: string;
    customDailyAllocations?: Record<string, number>;
}
export declare class UpdateRewardDto {
    name?: string;
    description?: string;
    shortLabel?: string;
    carryForward?: boolean;
    baselineWeight?: number;
    colorHex?: string;
    iconUrl?: string;
    isActive?: boolean;
}
export declare class AdjustStockDto {
    quantityDelta: number;
    notes: string;
}
export declare enum CancellationResolutionEnum {
    IMMEDIATE_RETURN = "IMMEDIATE_RETURN",
    RETURN_TO_PACING = "RETURN_TO_PACING",
    RETIRE = "RETIRE"
}
export declare class CancelAwardDto {
    resolution: CancellationResolutionEnum;
    reason: string;
}
