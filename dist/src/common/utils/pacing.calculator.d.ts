export interface PacingContext {
    serverTime: Date;
    dayActualStart: Date;
    referenceEnd: Date;
    dailyTargetAllocation: number;
    awardedToday: number;
    availablePhysicalStock: number;
}
export interface PacingResult {
    elapsedFraction: number;
    releasedCumulativeTarget: number;
    availablePacedQuota: number;
    eligibleForSpin: boolean;
    effectiveAvailableForSpin: number;
    reason?: string;
}
export declare class PacingCalculator {
    static calculate(ctx: PacingContext): PacingResult;
    static parseTimeStringOnDate(dateStr: string, timeStr: string): Date;
}
