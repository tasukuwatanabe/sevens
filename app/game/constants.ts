import type { Suit, Rank } from "@/types/game";

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const INITIAL_RANK: Rank = 7;
export const MAX_PASSES = 3;
export const PLAYER_COUNT = 4;
export const CPU_THINK_MS = 1500;

export const CPU_PLAYER_COLORS = [
  { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-500" },
  { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-500" },
  { border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-500" },
] as const;
