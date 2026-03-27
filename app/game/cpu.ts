import type { Card, NormalCard, Player, Board } from "@/types/game";
import { getValidCards, isValidPlay, getValidJokerPositions } from "./rules";
import { areCardsEqual, isJokerCard } from "@/utils/card";
import { updateBoard } from "./state";

export type CpuAction =
  | { type: "place"; card: NormalCard }
  | { type: "pass" }
  | { type: "place-joker"; position: NormalCard };

export function countNewlyValidCards(card: NormalCard, hand: Card[], board: Board): number {
  const newBoard = updateBoard(board, card);
  const remainingHand = hand.filter((c) => !areCardsEqual(c, card));
  return remainingHand.filter((c) => isValidPlay(c, newBoard)).length;
}

export function hasNoAdjacentCard(card: NormalCard, hand: Card[]): boolean {
  return !hand.some(
    (c) =>
      !isJokerCard(c) &&
      c !== card &&
      (c as NormalCard).suit === card.suit &&
      ((c as NormalCard).rank === card.rank - 1 || (c as NormalCard).rank === card.rank + 1),
  );
}

export function calcDistanceScore(card: NormalCard): number {
  return Math.max(0, 3 - Math.min(card.rank - 1, 13 - card.rank));
}

function scoreCard(card: NormalCard, hand: Card[], board: Board): number {
  return (
    countNewlyValidCards(card, hand, board) * 10 +
    (hasNoAdjacentCard(card, hand) ? 5 : 0) +
    calcDistanceScore(card)
  );
}

function selectBestCard(validCards: NormalCard[], hand: Card[], board: Board): NormalCard {
  return validCards.reduce((best, card) =>
    scoreCard(card, hand, board) > scoreCard(best, hand, board) ? card : best,
  );
}

function pickCpuJokerPosition(positions: NormalCard[], allPlayers: Player[]): NormalCard {
  const humanPlayer = allPlayers.find((p) => p.type === "human")!;
  const humanTargets = positions.filter((pos) =>
    humanPlayer.hand.some((c) => !isJokerCard(c) && areCardsEqual(c, pos)),
  );
  return humanTargets.length > 0 ? humanTargets[0]! : positions[0]!;
}

export function decideCpuAction(player: Player, board: Board, allPlayers: Player[]): CpuAction {
  const hasJoker = player.hand.some(isJokerCard);
  const validCards = getValidCards(player.hand, board) as NormalCard[];
  const validJokerPositions = hasJoker ? getValidJokerPositions(board) : [];

  if (hasJoker && validCards.length === 0 && validJokerPositions.length > 0) {
    return { type: "place-joker", position: pickCpuJokerPosition(validJokerPositions, allPlayers) };
  }

  if (validCards.length === 0) {
    return { type: "pass" };
  }

  return {
    type: "place",
    card: selectBestCard(validCards, player.hand, board),
  };
}
