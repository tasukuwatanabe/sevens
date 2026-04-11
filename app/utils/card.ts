import type { Suit, Rank, Card, NormalCard, JokerCard } from "@/types/game";
import { SUITS } from "@/game/constants";

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

export function isJokerCard(card: Card): card is JokerCard {
  return (card as JokerCard).isJoker === true;
}

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
  if (isJokerCard(a) || isJokerCard(b)) return isJokerCard(a) && isJokerCard(b);
  return (
    (a as NormalCard).suit === (b as NormalCard).suit &&
    (a as NormalCard).rank === (b as NormalCard).rank
  );
}

export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const aJoker = isJokerCard(a);
    const bJoker = isJokerCard(b);
    if (aJoker && bJoker) return 0;
    if (aJoker) return 1;
    if (bJoker) return -1;
    const suitDiff = SUITS.indexOf((a as NormalCard).suit) - SUITS.indexOf((b as NormalCard).suit);
    if (suitDiff !== 0) return suitDiff;
    return (a as NormalCard).rank - (b as NormalCard).rank;
  });
}
