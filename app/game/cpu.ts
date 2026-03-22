import type { Card, Player, Board } from "@/types/game";
import { getValidCards, isValidPlay } from "./rules";
import { areCardsEqual } from "@/utils/card";
import { updateBoard } from "./state";

export type CpuAction = { type: "place"; card: Card } | { type: "pass" };

export function countNewlyValidCards(card: Card, hand: Card[], board: Board): number {
  const newBoard = updateBoard(board, card);
  const remainingHand = hand.filter((c) => !areCardsEqual(c, card));
  return remainingHand.filter((c) => isValidPlay(c, newBoard)).length;
}

export function hasNoAdjacentCard(card: Card, hand: Card[]): boolean {
  return !hand.some(
    (c) =>
      c !== card && c.suit === card.suit && (c.rank === card.rank - 1 || c.rank === card.rank + 1),
  );
}

export function calcDistanceScore(card: Card): number {
  return Math.max(0, 3 - Math.min(card.rank - 1, 13 - card.rank));
}

function scoreCard(card: Card, hand: Card[], board: Board): number {
  return (
    countNewlyValidCards(card, hand, board) * 10 +
    (hasNoAdjacentCard(card, hand) ? 5 : 0) +
    calcDistanceScore(card)
  );
}

function selectBestCard(validCards: Card[], hand: Card[], board: Board): Card {
  return validCards.reduce((best, card) =>
    scoreCard(card, hand, board) > scoreCard(best, hand, board) ? card : best,
  );
}

export function decideCpuAction(player: Player, board: Board): CpuAction {
  const validCards = getValidCards(player.hand, board);

  if (validCards.length === 0) {
    return { type: "pass" };
  }

  return {
    type: "place",
    card: selectBestCard(validCards, player.hand, board),
  };
}
