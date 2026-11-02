export declare class CreateSliceDto {
    sliceIndex: number;
    rewardId?: string;
    isNoWin?: boolean;
    label: string;
    backgroundColor: string;
    textColor: string;
    iconUrl?: string;
}
export declare class CreateWheelConfigDto {
    name: string;
    sliceCount: number;
    slices: CreateSliceDto[];
}
export declare class PriorityItemDto {
    rewardId: string;
    rank: number;
}
export declare class CreatePriorityListDto {
    name: string;
    items: PriorityItemDto[];
}
