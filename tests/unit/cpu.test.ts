import { describe, it, expect } from "vite-plus/test";
import {
  decideCpuAction,
  countNewlyValidCards,
  hasNoAdjacentCard,
  calcDistanceScore,
} from "@/game/cpu";
import type { Card, Player, Board } from "@/types/game";

function makeBoard(): Board {
  return {
    spades: { suit: "spades", low: 7, high: 7 },
    hearts: { suit: "hearts", low: 7, high: 7 },
    diamonds: { suit: "diamonds", low: 7, high: 7 },
    clubs: { suit: "clubs", low: 7, high: 7 },
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "cpu1",
    type: "cpu",
    name: "CPU 1",
    hand: [],
    passesUsed: 0,
    ...overrides,
  };
}

describe("countNewlyValidCards", () => {
  it("カードを置くことで新たに有効になるカード数を返す", () => {
    const board = makeBoard();
    const card: Card = { suit: "spades", rank: 6 };
    const hand: Card[] = [card, { suit: "spades", rank: 5 }];
    expect(countNewlyValidCards(card, hand, board)).toBe(1);
  });

  it("新たに有効になるカードがなければ0を返す", () => {
    const board = makeBoard();
    const card: Card = { suit: "spades", rank: 6 };
    const hand: Card[] = [card, { suit: "hearts", rank: 5 }];
    expect(countNewlyValidCards(card, hand, board)).toBe(0);
  });
});

describe("hasNoAdjacentCard", () => {
  it("同スートの隣接カードがない場合はtrueを返す", () => {
    const card: Card = { suit: "spades", rank: 6 };
    const hand: Card[] = [card, { suit: "hearts", rank: 5 }];
    expect(hasNoAdjacentCard(card, hand)).toBe(true);
  });

  it("同スートの隣接カードがある場合はfalseを返す", () => {
    const card: Card = { suit: "spades", rank: 6 };
    const hand: Card[] = [card, { suit: "spades", rank: 5 }];
    expect(hasNoAdjacentCard(card, hand)).toBe(false);
  });
});

describe("calcDistanceScore", () => {
  it("エッジに近いカード(rank=1)は最大スコア3を返す", () => {
    expect(calcDistanceScore({ suit: "spades", rank: 1 })).toBe(3);
  });

  it("エッジに近いカード(rank=13)は最大スコア3を返す", () => {
    expect(calcDistanceScore({ suit: "spades", rank: 13 })).toBe(3);
  });

  it("中央付近のカード(rank=7)はスコア0を返す", () => {
    expect(calcDistanceScore({ suit: "spades", rank: 7 })).toBe(0);
  });
});

describe("decideCpuAction", () => {
  it("有効なカードがある場合はplaceを返す", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 6 }] });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("place");
  });

  it("placeの場合はcardが含まれる", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 6 }] });
    const action = decideCpuAction(player, makeBoard());
    if (action.type === "place") {
      expect(action.card).toEqual({ suit: "spades", rank: 6 });
    }
  });

  it("有効なカードがなくパスが残っている場合はpassを返す", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 0,
    });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("pass");
  });

  it("有効なカードがなくパス上限の場合もpassを返す（手詰まり防止）", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 3,
    });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("pass");
  });

  it("複数の有効なカードがある場合はいずれかを選ぶ", () => {
    const player = makePlayer({
      hand: [
        { suit: "spades", rank: 6 },
        { suit: "hearts", rank: 8 },
        { suit: "diamonds", rank: 6 },
      ],
    });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("place");
    if (action.type === "place") {
      const validRankSuit = [
        { suit: "spades", rank: 6 },
        { suit: "hearts", rank: 8 },
        { suit: "diamonds", rank: 6 },
      ];
      expect(
        validRankSuit.some((c) => c.suit === action.card.suit && c.rank === action.card.rank),
      ).toBe(true);
    }
  });
});
