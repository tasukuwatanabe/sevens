import type { Card, Player, Board } from "@/types/game";
import { getValidCards, canPass } from "./rules";
import { isValidPlay } from "./rules";

type CpuAction = { type: "place"; card: Card } | { type: "pass" };

function scoreCard(card: Card, hand: Card[], board: Board): number {
  let score = 0;

  const newBoard = {
    ...board,
    [card.suit]: {
      ...board[card.suit],
      low: card.rank < board[card.suit].low ? card.rank : board[card.suit].low,
      high: card.rank > board[card.suit].high ? card.rank : board[card.suit].high,
    },
  };
  const remainingHand = hand.filter((c) => !(c.suit === card.suit && c.rank === card.rank));
  const newlyValid = remainingHand.filter((c) => isValidPlay(c, newBoard));
  score += newlyValid.length * 10;

  const hasAdjacentInHand = hand.some(
    (c) =>
      c !== card && c.suit === card.suit && (c.rank === card.rank - 1 || c.rank === card.rank + 1),
  );
  if (!hasAdjacentInHand) score += 5;

  const distanceFromEdge = Math.min(card.rank - 1, 13 - card.rank);
  score += Math.max(0, 3 - distanceFromEdge);

  return score;
}

function selectBestCard(validCards: Card[], hand: Card[], board: Board): Card {
  let best = validCards[0]!;
  let bestScore = scoreCard(best, hand, board);

  for (let i = 1; i < validCards.length; i++) {
    const score = scoreCard(validCards[i]!, hand, board);
    if (score > bestScore) {
      best = validCards[i]!;
      bestScore = score;
    }
  }

  return best;
}

export function decideCpuAction(player: Player, board: Board): CpuAction {
  const validCards = getValidCards(player.hand, board);

  if (validCards.length === 0) {
    if (canPass(player)) return { type: "pass" };
    return { type: "pass" };
  }

  return { type: "place", card: selectBestCard(validCards, player.hand, board) };
}
