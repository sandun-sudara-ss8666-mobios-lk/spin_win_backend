export interface SliceWeightInfo {
    sliceId: string;
    sliceIndex: number;
    rewardId?: string | null;
    label: string;
    isNoWin: boolean;
    baselineWeight: number;
    rank?: number | null;
    isEligible: boolean;
}
export interface SliceProbabilityPreview {
    sliceId: string;
    sliceIndex: number;
    label: string;
    rewardId?: string | null;
    isNoWin: boolean;
    baselineWeight: number;
    rank?: number | null;
    priorityMultiplier: number;
    finalWeight: number;
    probabilityPercent: number;
    isEligible: boolean;
}
export declare class PriorityCurveCalculator {
    static readonly DEFAULT_BOOST_FACTOR = 2;
    static getMultiplier(rank: number, totalRanked: number, boostFactor?: number): number;
    static calculateProbabilities(slices: SliceWeightInfo[], totalRankedInList?: number, boostFactor?: number): SliceProbabilityPreview[];
}
