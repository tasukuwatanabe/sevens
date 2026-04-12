import type { Card, NormalCard, Player, Board } from "@/types/game";
import {
  getValidCards,
  isValidPlay,
  getValidJokerPositions,
  getJokerWithCardOptions,
  canPass,
} from "./rules";
import type { JokerWithCardOption } from "./rules";
import { areCardsEqual, isJokerCard, isNormalCard } from "@/utils/card";
import { updateBoard } from "./state";

export type CpuAction =
  | { type: "place"; card: NormalCard }
  | { type: "pass" }
  | { type: "eliminate" }
  | { type: "place-joker"; position: NormalCard }
  | { type: "place-joker-with-card"; jokerPos: NormalCard; companionCard: NormalCard };

export function countNewlyValidCards(card: NormalCard, hand: Card[], board: Board): number {
  const newBoard = updateBoard(board, card);
  const remainingHand = hand.filter((c) => !areCardsEqual(c, card));
  return remainingHand.filter((c) => isValidPlay(c, newBoard)).length;
}

export function hasNoAdjacentCard(card: NormalCard, hand: Card[]): boolean {
  return !hand.some(
    (c) =>
      isNormalCard(c) &&
      c !== card &&
      c.suit === card.suit &&
      (c.rank === card.rank - 1 || c.rank === card.rank + 1),
  );
}

// 両端（A/K）に近いカードほど将来置ける位置が少なくなるため優先度を下げる
// rank 7付近は0、rank 1/13は最大3を返す
export function calcDistanceScore(card: NormalCard): number {
  return Math.max(0, 3 - Math.min(card.rank - 1, 13 - card.rank));
}

// 手番で出すカードのスコアを算出する（高いほど優先）
// - 新たに有効なカードを増やす効果を最重視（×10）
// - 隣接カードがない孤立したカードを早めに場に出す（+5）
// - 両端に近いカードを優先して場を広げる（0〜3）
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

// 妨害戦略として人間プレイヤーが持つカードの位置を優先する
// ジョーカーを渡すことで人間の手を一枚増やし、次の手を塞ぐ
function pickHumanTarget<T>(items: T[], getCard: (item: T) => NormalCard, allPlayers: Player[]): T {
  const humanPlayer = allPlayers.find((p) => p.type === "human");
  if (humanPlayer) {
    const target = items.find((item) =>
      humanPlayer.hand.some((c) => !isJokerCard(c) && areCardsEqual(c, getCard(item))),
    );
    if (target) return target;
  }
  return items[0]!;
}

function pickCpuJokerPosition(positions: NormalCard[], allPlayers: Player[]): NormalCard {
  return pickHumanTarget(positions, (pos) => pos, allPlayers);
}

function pickBestJokerWithCardOption(
  options: JokerWithCardOption[],
  allPlayers: Player[],
): JokerWithCardOption {
  return pickHumanTarget(options, (opt) => opt.jokerPos, allPlayers);
}

export function decideCpuAction(player: Player, board: Board, allPlayers: Player[]): CpuAction {
  const hasJoker = player.hand.some(isJokerCard);
  // getValidCards filters through isValidPlay, which returns false for jokers,
  // so all results are guaranteed to be NormalCard
  const validCards = getValidCards(player.hand, board) as NormalCard[];

  // 通常カードが出せる場合はジョーカーを温存する（詰まった時の切り札として使う）
  if (validCards.length > 0) {
    return { type: "place", card: selectBestCard(validCards, player.hand, board) };
  }

  if (hasJoker) {
    // コンボ出しはジョーカー単体より2枚分手札を減らせるため優先する
    const jokerWithCardOptions = getJokerWithCardOptions(player.hand, board);
    if (jokerWithCardOptions.length > 0) {
      const best = pickBestJokerWithCardOption(jokerWithCardOptions, allPlayers);
      return {
        type: "place-joker-with-card",
        jokerPos: best.jokerPos,
        companionCard: best.companionCard,
      };
    }
    const validJokerPositions = getValidJokerPositions(board);
    if (validJokerPositions.length > 0) {
      return {
        type: "place-joker",
        position: pickCpuJokerPosition(validJokerPositions, allPlayers),
      };
    }
  }

  return canPass(player) ? { type: "pass" } : { type: "eliminate" };
}
