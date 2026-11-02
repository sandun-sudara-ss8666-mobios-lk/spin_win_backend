export interface SliceWeightInfo {
  sliceId: string;
  sliceIndex: number;
  rewardId?: string | null;
  label: string;
  isNoWin: boolean;
  baselineWeight: number; // e.g. 1..10
  rank?: number | null; // 1..N if in active priority list, else undefined/null
  isEligible: boolean; // true if stock and pacing permit
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
  probabilityPercent: number; // 0 to 100
  isEligible: boolean;
}

export class PriorityCurveCalculator {
  public static readonly DEFAULT_BOOST_FACTOR = 2.0;

  /**
   * Computes the strictly decreasing monotonic multiplier for rank r in 1..N.
   * Rank 1 receives the highest multiplier, Rank N receives > 1.0, unranked receives 1.0.
   */
  static getMultiplier(
    rank: number,
    totalRanked: number,
    boostFactor: number = this.DEFAULT_BOOST_FACTOR,
  ): number {
    if (rank <= 0 || totalRanked <= 0 || rank > totalRanked) {
      return 1.0;
    }
    // Strictly monotonic: (N - rank + 1) / N gives 1.0 for rank 1, down to 1/N for rank N
    const slope = (totalRanked - rank + 1) / totalRanked;
    return Math.round((1.0 + slope * boostFactor) * 1000) / 1000;
  }

  /**
   * Calculates final weights and relative probabilities for a collection of slices.
   */
  static calculateProbabilities(
    slices: SliceWeightInfo[],
    totalRankedInList: number = 0,
    boostFactor: number = this.DEFAULT_BOOST_FACTOR,
  ): SliceProbabilityPreview[] {
    const results: SliceProbabilityPreview[] = [];
    let totalEligibleWeight = 0;

    for (const slice of slices) {
      const baseline = Math.max(1, slice.baselineWeight || 1);
      let multiplier = 1.0;

      if (slice.rank && slice.rank > 0 && totalRankedInList > 0) {
        multiplier = this.getMultiplier(
          slice.rank,
          totalRankedInList,
          boostFactor,
        );
      }

      // If slice is ineligible, its weight becomes 0 in selection
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

    // Compute percentage probabilities
    for (const item of results) {
      if (totalEligibleWeight > 0 && item.finalWeight > 0) {
        item.probabilityPercent =
          Math.round((item.finalWeight / totalEligibleWeight) * 10000) / 100;
      } else {
        item.probabilityPercent = 0;
      }
    }

    return results;
  }
}
