import type { Suit, Rank, Card } from "@/types/game";

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

const SUIT_LABELS: Record<Suit, string> = {
  spades: "スペード",
  hearts: "ハート",
  diamonds: "ダイヤ",
  clubs: "クラブ",
};

export function suitSymbol(suit: Suit) {
  return SUIT_SYMBOLS[suit];
}

export function suitLabel(suit: Suit): string {
  return SUIT_LABELS[suit];
}

export function rankLabel(rank: Rank) {
  return RANK_LABELS[rank];
}

export function isRedSuit(suit: Suit) {
  return suit === "hearts" || suit === "diamonds";
}

export function areCardsEqual(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}
