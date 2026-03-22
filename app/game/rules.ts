import type { Card, Board, Player } from "@/types/game";
import { MAX_PASSES } from "./constants";

export function isValidPlay(card: Card, board: Board): boolean {
  const row = board[card.suit];
  return card.rank === row.low - 1 || card.rank === row.high + 1;
}

export function getValidCards(hand: Card[], board: Board): Card[] {
  return hand.filter((card) => isValidPlay(card, board));
}

export function canPass(player: Player): boolean {
  return player.passesUsed < MAX_PASSES;
}
