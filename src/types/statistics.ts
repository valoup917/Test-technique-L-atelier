/**
 * Type definitions for Statistics
 */

export interface Statistics {
  countryWithHighestWinRatio: {
    countryCode: string;
    winRatio: number;
  } | null;
  averageIMC: number | null;
  medianHeight: number | null;
}
