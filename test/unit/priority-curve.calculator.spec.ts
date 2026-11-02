import {
  PriorityCurveCalculator,
  SliceWeightInfo,
} from '../../src/common/utils/priority-curve.calculator';

describe('PriorityCurveCalculator (Strict Monotonic Preference Curve)', () => {
  it('should generate strictly decreasing multipliers for ranks 1..N', () => {
    const totalRanked = 4;
    const m1 = PriorityCurveCalculator.getMultiplier(1, totalRanked);
    const m2 = PriorityCurveCalculator.getMultiplier(2, totalRanked);
    const m3 = PriorityCurveCalculator.getMultiplier(3, totalRanked);
    const m4 = PriorityCurveCalculator.getMultiplier(4, totalRanked);
    const mUnranked = PriorityCurveCalculator.getMultiplier(0, totalRanked);

    // Multipliers must be strictly ordered
    expect(m1).toBeGreaterThan(m2);
    expect(m2).toBeGreaterThan(m3);
    expect(m3).toBeGreaterThan(m4);
    expect(m4).toBeGreaterThan(mUnranked);
    expect(mUnranked).toBe(1.0);
  });

  it('should calculate preview probabilities and preserve random non-deterministic outcomes', () => {
    const slices: SliceWeightInfo[] = [
      {
        sliceId: 's1',
        sliceIndex: 0,
        rewardId: 'r1',
        label: 'iPhone 16 (Rank 1)',
        isNoWin: false,
        baselineWeight: 5,
        rank: 1,
        isEligible: true,
      },
      {
        sliceId: 's2',
        sliceIndex: 1,
        rewardId: 'r2',
        label: 'AirPods (Rank 2)',
        isNoWin: false,
        baselineWeight: 5,
        rank: 2,
        isEligible: true,
      },
      {
        sliceId: 's3',
        sliceIndex: 2,
        rewardId: 'r3',
        label: 'T-Shirt (Unranked)',
        isNoWin: false,
        baselineWeight: 5,
        rank: null,
        isEligible: true,
      },
      {
        sliceId: 's4',
        sliceIndex: 3,
        rewardId: null,
        label: 'Better Luck Next Time',
        isNoWin: true,
        baselineWeight: 10,
        rank: null,
        isEligible: true,
      },
    ];

    const preview = PriorityCurveCalculator.calculateProbabilities(slices, 2);

    expect(preview).toHaveLength(4);

    const s1 = preview.find((p) => p.sliceId === 's1')!;
    const s2 = preview.find((p) => p.sliceId === 's2')!;
    const s3 = preview.find((p) => p.sliceId === 's3')!;
    const s4 = preview.find((p) => p.sliceId === 's4')!;

    // Same baseline weight 5: s1 must have higher probability than s2, and s2 higher than s3
    expect(s1.finalWeight).toBeGreaterThan(s2.finalWeight);
    expect(s2.finalWeight).toBeGreaterThan(s3.finalWeight);

    // s4 has baseline 10, so it remains positive
    expect(s4.finalWeight).toBe(10);

    // Sum of probabilities must equal ~100%
    const totalPercent = preview.reduce(
      (sum, p) => sum + p.probabilityPercent,
      0,
    );
    expect(totalPercent).toBeCloseTo(100, 0);
  });

  it('should assign 0% probability to ineligible slices while keeping eligible weights active', () => {
    const slices: SliceWeightInfo[] = [
      {
        sliceId: 's1',
        sliceIndex: 0,
        rewardId: 'r1',
        label: 'Rank 1 (Out of Stock)',
        isNoWin: false,
        baselineWeight: 10,
        rank: 1,
        isEligible: false, // ineligibility must override priority!
      },
      {
        sliceId: 's2',
        sliceIndex: 1,
        rewardId: 'r2',
        label: 'Rank 2 (Available)',
        isNoWin: false,
        baselineWeight: 5,
        rank: 2,
        isEligible: true,
      },
      {
        sliceId: 's3',
        sliceIndex: 2,
        rewardId: null,
        label: 'Fallback No Win',
        isNoWin: true,
        baselineWeight: 5,
        rank: null,
        isEligible: true,
      },
    ];

    const preview = PriorityCurveCalculator.calculateProbabilities(slices, 2);
    const s1 = preview.find((p) => p.sliceId === 's1')!;
    const s2 = preview.find((p) => p.sliceId === 's2')!;

    expect(s1.finalWeight).toBe(0);
    expect(s1.probabilityPercent).toBe(0);
    expect(s2.finalWeight).toBeGreaterThan(0);
    expect(s2.probabilityPercent).toBeGreaterThan(0);
  });
});
