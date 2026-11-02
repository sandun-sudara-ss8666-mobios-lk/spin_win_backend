"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacingCalculator = void 0;
class PacingCalculator {
    static calculate(ctx) {
        const { serverTime, dayActualStart, referenceEnd, dailyTargetAllocation, awardedToday, availablePhysicalStock, } = ctx;
        if (availablePhysicalStock <= 0) {
            return {
                elapsedFraction: 0,
                releasedCumulativeTarget: 0,
                availablePacedQuota: 0,
                eligibleForSpin: false,
                effectiveAvailableForSpin: 0,
                reason: 'PHYSICAL_STOCK_EXHAUSTED',
            };
        }
        if (dailyTargetAllocation <= 0) {
            return {
                elapsedFraction: 0,
                releasedCumulativeTarget: 0,
                availablePacedQuota: 0,
                eligibleForSpin: false,
                effectiveAvailableForSpin: 0,
                reason: 'NO_DAILY_ALLOCATION',
            };
        }
        const tServer = serverTime.getTime();
        const tStart = dayActualStart.getTime();
        const tEnd = referenceEnd.getTime();
        let fraction = 0;
        if (tServer < tStart) {
            fraction = 0;
        }
        else if (tStart >= tEnd) {
            fraction = 1.0;
        }
        else if (tServer >= tEnd) {
            fraction = 1.0;
        }
        else {
            const duration = tEnd - tStart;
            const elapsed = tServer - tStart;
            fraction = Math.min(1.0, Math.max(0.0, elapsed / duration));
        }
        let releasedCumulativeTarget = 0;
        if (fraction >= 1.0) {
            releasedCumulativeTarget = dailyTargetAllocation;
        }
        else if (fraction <= 0) {
            releasedCumulativeTarget = 0;
        }
        else {
            releasedCumulativeTarget = Math.max(1, Math.floor(fraction * dailyTargetAllocation));
            releasedCumulativeTarget = Math.min(releasedCumulativeTarget, dailyTargetAllocation);
        }
        const availablePacedQuota = Math.max(0, releasedCumulativeTarget - awardedToday);
        const effectiveAvailableForSpin = Math.min(availablePacedQuota, availablePhysicalStock);
        const eligibleForSpin = effectiveAvailableForSpin > 0;
        let reason = undefined;
        if (!eligibleForSpin) {
            if (availablePacedQuota <= 0) {
                reason = 'PACED_QUOTA_EXHAUSTED';
            }
            else {
                reason = 'PHYSICAL_STOCK_EXHAUSTED';
            }
        }
        return {
            elapsedFraction: fraction,
            releasedCumulativeTarget,
            availablePacedQuota,
            effectiveAvailableForSpin,
            eligibleForSpin,
            reason,
        };
    }
    static parseTimeStringOnDate(dateStr, timeStr) {
        const parts = timeStr.split(':').map((s) => parseInt(s, 10));
        const hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        const seconds = parts[2] || 0;
        const [year, month, day] = dateStr.split('-').map((s) => parseInt(s, 10));
        return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    }
}
exports.PacingCalculator = PacingCalculator;
//# sourceMappingURL=pacing.calculator.js.map