import type { Rank } from "@/types/game";

/**
 * Check if a number is a valid Rank (1-13)
 * Can be used as a type guard: if (isValidRank(value)) { value is Rank }
 */
export function isValidRank(value: number): value is Rank {
  return Number.isInteger(value) && value >= 1 && value <= 13;
}

/**
 * Create a Rank, throwing if invalid
 * Use when the invariant is guaranteed by preceding conditions (e.g., row.low > 2)
 */
export function createRank(value: number): Rank {
  if (!isValidRank(value)) {
    throw new RangeError(`Invalid rank: ${value}, must be 1-13`);
  }
  return value;
}

/**
 * Safely create a Rank, returning null if invalid
 * Use when you're uncertain about the value's validity
 */
export function safeRank(value: number): Rank | null {
  return isValidRank(value) ? value : null;
}
