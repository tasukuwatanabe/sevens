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

export function shouldEliminate(player: Player, board: Board): boolean {
  if (player.eliminated) return false;
  if (canPass(player)) return false;
  if (getValidCards(player.hand, board).length > 0) return false;
  if (player.hand.some(isJokerCard) && getValidJokerPositions(board).length > 0) return false;
  return true;
}

export type JokerWithCardOption = {
  jokerPos: NormalCard;
  companionCard: NormalCard;
};

// ジョーカーと一緒に隣接カードを出せる組み合わせを返す。
// ジョーカーを board edge ±1 に置くだけでなく、そのさらに外側の ±2 にある
// カードを手札に持っていれば2枚同時出しが可能なため、その候補を列挙する。
// holder 自身が jokerPos 本体のカードを持っている場合はコンボとして無意味
// (普通に本体カードを出した方が joker を温存できる) な上、placeJokerWithCard
// で recipient 判定がスキップされ手札に本体カードが残ってしまうため除外する。
export function getJokerWithCardOptions(hand: Card[], board: Board): JokerWithCardOption[] {
  if (!hand.some(isJokerCard)) return [];
  const options: JokerWithCardOption[] = [];
  for (const suit of SUITS) {
    const row = board[suit];
    // low 側: ジョーカーを low-1、コンパニオンを low-2 に置く
    // row.low > 2 で絞ることで jokerPos >= 2、companionRank >= 1 を保証する
    if (row.low > 2) {
      const jokerRank = (row.low - 1) as NormalCard["rank"];
      const holderHasJokerPos = hand.some(
        (c) => !isJokerCard(c) && c.suit === suit && c.rank === jokerRank,
      );
      if (!holderHasJokerPos) {
        const companionRank = (row.low - 2) as NormalCard["rank"];
        const found = hand.find(
          (c): c is NormalCard => !isJokerCard(c) && c.suit === suit && c.rank === companionRank,
        );
        if (found) {
          options.push({
            jokerPos: { suit, rank: jokerRank },
            companionCard: found,
          });
        }
      }
    }
    // high 側: ジョーカーを high+1、コンパニオンを high+2 に置く
    // row.high < 12 で絞ることで jokerPos <= 12、companionRank <= 13 を保証する
    if (row.high < 12) {
      const jokerRank = (row.high + 1) as NormalCard["rank"];
      const holderHasJokerPos = hand.some(
        (c) => !isJokerCard(c) && c.suit === suit && c.rank === jokerRank,
      );
      if (!holderHasJokerPos) {
        const companionRank = (row.high + 2) as NormalCard["rank"];
        const found = hand.find(
          (c): c is NormalCard => !isJokerCard(c) && c.suit === suit && c.rank === companionRank,
        );
        if (found) {
          options.push({
            jokerPos: { suit, rank: jokerRank },
            companionCard: found,
          });
        }
      }
    }
  }
  return options;
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
