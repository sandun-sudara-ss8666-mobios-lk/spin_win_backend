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

export class PacingCalculator {
  /**
   * Deterministically calculates pacing availability for a given reward at serverTime.
   */
  static calculate(ctx: PacingContext): PacingResult {
    const {
      serverTime,
      dayActualStart,
      referenceEnd,
      dailyTargetAllocation,
      awardedToday,
      availablePhysicalStock,
    } = ctx;

    // Hard physical stock check first
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
    } else if (tStart >= tEnd) {
      // Day was started after or at the reference closing time -> immediately release 100%
      fraction = 1.0;
    } else if (tServer >= tEnd) {
      // Current time is at or past reference closing time -> 100% released
      fraction = 1.0;
    } else {
      // Within pacing window
      const duration = tEnd - tStart;
      const elapsed = tServer - tStart;
      fraction = Math.min(1.0, Math.max(0.0, elapsed / duration));
    }

    let releasedCumulativeTarget = 0;
    if (fraction >= 1.0) {
      releasedCumulativeTarget = dailyTargetAllocation;
    } else if (fraction <= 0) {
      releasedCumulativeTarget = 0;
    } else {
      // Unlock proportionally: ensure at least 1 is unlocked once elapsed fraction > 0
      releasedCumulativeTarget = Math.max(
        1,
        Math.floor(fraction * dailyTargetAllocation),
      );
      // Never exceed daily target
      releasedCumulativeTarget = Math.min(
        releasedCumulativeTarget,
        dailyTargetAllocation,
      );
    }

    const availablePacedQuota = Math.max(
      0,
      releasedCumulativeTarget - awardedToday,
    );
    const effectiveAvailableForSpin = Math.min(
      availablePacedQuota,
      availablePhysicalStock,
    );
    const eligibleForSpin = effectiveAvailableForSpin > 0;

    let reason: string | undefined = undefined;
    if (!eligibleForSpin) {
      if (availablePacedQuota <= 0) {
        reason = 'PACED_QUOTA_EXHAUSTED';
      } else {
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

  /**
   * Helper to parse "HH:mm:ss" or "HH:mm" on a given reference date in a specific timezone or local date.
   */
  static parseTimeStringOnDate(dateStr: string, timeStr: string): Date {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" or "HH:mm:ss"
    const parts = timeStr.split(':').map((s) => parseInt(s, 10));
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    const [year, month, day] = dateStr.split('-').map((s) => parseInt(s, 10));
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  }
}
