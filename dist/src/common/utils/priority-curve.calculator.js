"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityCurveCalculator = void 0;
class PriorityCurveCalculator {
    static DEFAULT_BOOST_FACTOR = 2.0;
    static getMultiplier(rank, totalRanked, boostFactor = this.DEFAULT_BOOST_FACTOR) {
        if (rank <= 0 || totalRanked <= 0 || rank > totalRanked) {
            return 1.0;
        }
        const slope = (totalRanked - rank + 1) / totalRanked;
        return Math.round((1.0 + slope * boostFactor) * 1000) / 1000;
    }
    static calculateProbabilities(slices, totalRankedInList = 0, boostFactor = this.DEFAULT_BOOST_FACTOR) {
        const results = [];
        let totalEligibleWeight = 0;
        for (const slice of slices) {
            const baseline = Math.max(1, slice.baselineWeight || 1);
            let multiplier = 1.0;
            if (slice.rank && slice.rank > 0 && totalRankedInList > 0) {
                multiplier = this.getMultiplier(slice.rank, totalRankedInList, boostFactor);
            }
            const finalWeight = slice.isEligible ? baseline * multiplier : 0;
            totalEligibleWeight += finalWeight;
            results.push({
                sliceId: slice.sliceId,
                sliceIndex: slice.sliceIndex,
                label: slice.label,
                rewardId: slice.rewardId,
                isNoWin: slice.isNoWin,
                baselineWeight: baseline,
                rank: slice.rank,
                priorityMultiplier: multiplier,
                finalWeight,
                probabilityPercent: 0,
                isEligible: slice.isEligible,
            });
        }
        for (const item of results) {
            if (totalEligibleWeight > 0 && item.finalWeight > 0) {
                item.probabilityPercent =
                    Math.round((item.finalWeight / totalEligibleWeight) * 10000) / 100;
            }
            else {
                item.probabilityPercent = 0;
            }
        }
        return results;
    }
}
exports.PriorityCurveCalculator = PriorityCurveCalculator;
//# sourceMappingURL=priority-curve.calculator.js.map