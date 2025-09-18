// domain/value-objects/FixpointsConversion.ts
export class FixpointsConversion {
  private static readonly CONVERSION_RATES = {
    TIER_500: { points: 500, naira: 1000 },
    TIER_1000: { points: 1000, naira: 2000 },
  };

  static convertToNaira(points: number): number {
    if (points < 500) return 0;

    if (points >= 1000) {
      return Math.floor(points / 1000) * this.CONVERSION_RATES.TIER_1000.naira;
    } else {
      return Math.floor(points / 500) * this.CONVERSION_RATES.TIER_500.naira;
    }
  }

  static getRequiredPoints(nairaAmount: number): number | null {
    if (nairaAmount >= 2000 && nairaAmount % 2000 === 0) {
      return (nairaAmount / 2000) * 1000; // 1000 points per 2000 naira
    } else if (nairaAmount >= 1000 && nairaAmount % 1000 === 0) {
      return (nairaAmount / 1000) * 500; // 500 points per 1000 naira
    }
    return null; // Invalid conversion
  }

  static isValidRedemption(points: number): boolean {
    return points >= 1000 && points % 500 === 0;
  }
}
