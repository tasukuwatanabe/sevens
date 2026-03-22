import type { Suit, Rank } from "../app/types/game";

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const INITIAL_RANK: Rank = 7;
export const MAX_PASSES = 3;
export const PLAYER_COUNT = 4;
