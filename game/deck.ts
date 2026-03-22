import type { Card } from "../app/types/game";
import { SUITS, RANKS } from "./constants";

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

export function shuffleDeck(deck: Card[]): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function dealCards(deck: Card[], playerCount: number): Card[][] {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, i) => {
    hands[i % playerCount]!.push(card);
  });
  return hands;
}
