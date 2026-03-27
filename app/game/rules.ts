import type { Card, NormalCard, Board, Player } from "@/types/game";
import { SUITS, MAX_PASSES } from "./constants";
import { isJokerCard } from "@/utils/card";

export function isValidPlay(card: Card, board: Board): boolean {
  if (isJokerCard(card)) return false;
  const c = card as NormalCard;
  const row = board[c.suit];
  return c.rank === row.low - 1 || c.rank === row.high + 1;
}

export function getValidCards(hand: Card[], board: Board): Card[] {
  return hand.filter((card) => isValidPlay(card, board));
}

export function canPass(player: Player): boolean {
  return player.passesUsed < MAX_PASSES;
}

export function getValidJokerPositions(board: Board): NormalCard[] {
  const positions: NormalCard[] = [];
  for (const suit of SUITS) {
    const row = board[suit];
    if (row.low > 1) positions.push({ suit, rank: (row.low - 1) as NormalCard["rank"] });
    if (row.high < 13) positions.push({ suit, rank: (row.high + 1) as NormalCard["rank"] });
  }
  return positions;
}
