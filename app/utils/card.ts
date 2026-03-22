import type { Suit, Rank } from "../types/game";

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const RANK_LABELS: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export function suitSymbol(suit: Suit) {
  return SUIT_SYMBOLS[suit];
}

export function rankLabel(rank: Rank) {
  return RANK_LABELS[rank];
}

export function isRedSuit(suit: Suit) {
  return suit === "hearts" || suit === "diamonds";
}
