import { PacingCalculator } from '../../src/common/utils/pacing.calculator';

describe('PacingCalculator (Deterministic Dynamic Rolling Release)', () => {
  const startAt11Am = new Date('2026-11-06T11:00:00Z');
  const referenceEndAt9Pm = new Date('2026-11-06T21:00:00Z'); // 10 hour duration
  const dailyTarget = 100;
  const availableStock = 500;

  it('should return 0 released quota before actual day start', () => {
    const beforeStart = new Date('2026-11-06T10:30:00Z');
    const result = PacingCalculator.calculate({
      serverTime: beforeStart,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: dailyTarget,
      awardedToday: 0,
      availablePhysicalStock: availableStock,
    });

    expect(result.elapsedFraction).toBe(0);
    expect(result.releasedCumulativeTarget).toBe(0);
    expect(result.eligibleForSpin).toBe(false);
  });

  it('should pace accurately at the midpoint (4:00 PM, 5 hours into 10-hour window)', () => {
    const midPoint = new Date('2026-11-06T16:00:00Z'); // exactly 50%
    const result = PacingCalculator.calculate({
      serverTime: midPoint,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: dailyTarget,
      awardedToday: 20,
      availablePhysicalStock: availableStock,
    });

    expect(result.elapsedFraction).toBeCloseTo(0.5, 3);
    expect(result.releasedCumulativeTarget).toBe(50);
    expect(result.availablePacedQuota).toBe(30); // 50 released - 20 awarded
    expect(result.effectiveAvailableForSpin).toBe(30);
    expect(result.eligibleForSpin).toBe(true);
  });

  it('should mark reward ineligible if released quota is exhausted even if physical stock remains', () => {
    const midPoint = new Date('2026-11-06T16:00:00Z'); // 50 released
    const result = PacingCalculator.calculate({
      serverTime: midPoint,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: dailyTarget,
      awardedToday: 50, // all 50 released so far have been awarded
      availablePhysicalStock: availableStock,
    });

    expect(result.releasedCumulativeTarget).toBe(50);
    expect(result.availablePacedQuota).toBe(0);
    expect(result.eligibleForSpin).toBe(false);
    expect(result.reason).toBe('PACED_QUOTA_EXHAUSTED');
  });

  it('should release 100% of allocation at and after reference closing time (9:00 PM and 11:30 PM)', () => {
    const at9Pm = new Date('2026-11-06T21:00:00Z');
    const resultAt9Pm = PacingCalculator.calculate({
      serverTime: at9Pm,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: dailyTarget,
      awardedToday: 40,
      availablePhysicalStock: availableStock,
    });

    expect(resultAt9Pm.elapsedFraction).toBe(1.0);
    expect(resultAt9Pm.releasedCumulativeTarget).toBe(100);
    expect(resultAt9Pm.availablePacedQuota).toBe(60);
    expect(resultAt9Pm.eligibleForSpin).toBe(true);

    const postEndAt1130Pm = new Date('2026-11-06T23:30:00Z');
    const resultPostEnd = PacingCalculator.calculate({
      serverTime: postEndAt1130Pm,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: dailyTarget,
      awardedToday: 95,
      availablePhysicalStock: availableStock,
    });

    expect(resultPostEnd.elapsedFraction).toBe(1.0);
    expect(resultPostEnd.releasedCumulativeTarget).toBe(100);
    expect(resultPostEnd.availablePacedQuota).toBe(5);
    expect(resultPostEnd.eligibleForSpin).toBe(true);
  });

  it('should release 100% immediately if day starts after reference closing time', () => {
    const lateStart = new Date('2026-11-06T21:30:00Z');
    const currentTime = new Date('2026-11-06T21:45:00Z');
    const result = PacingCalculator.calculate({
      serverTime: currentTime,
      dayActualStart: lateStart,
      referenceEnd: referenceEndAt9Pm, // 21:00 is before 21:30
      dailyTargetAllocation: dailyTarget,
      awardedToday: 10,
      availablePhysicalStock: availableStock,
    });

    expect(result.elapsedFraction).toBe(1.0);
    expect(result.releasedCumulativeTarget).toBe(100);
    expect(result.availablePacedQuota).toBe(90);
    expect(result.eligibleForSpin).toBe(true);
  });

  it('should never exceed remaining physical stock invariant', () => {
    const at9Pm = new Date('2026-11-06T21:00:00Z');
    const result = PacingCalculator.calculate({
      serverTime: at9Pm,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: 50,
      awardedToday: 0,
      availablePhysicalStock: 3, // only 3 physically left
    });

    expect(result.releasedCumulativeTarget).toBe(50);
    expect(result.availablePacedQuota).toBe(50);
    expect(result.effectiveAvailableForSpin).toBe(3); // strictly clamped to 3!
    expect(result.eligibleForSpin).toBe(true);
  });

  it('should immediately fail if physical stock is 0', () => {
    const at9Pm = new Date('2026-11-06T21:00:00Z');
    const result = PacingCalculator.calculate({
      serverTime: at9Pm,
      dayActualStart: startAt11Am,
      referenceEnd: referenceEndAt9Pm,
      dailyTargetAllocation: 50,
      awardedToday: 0,
      availablePhysicalStock: 0,
    });

    expect(result.eligibleForSpin).toBe(false);
    expect(result.reason).toBe('PHYSICAL_STOCK_EXHAUSTED');
  });
});
