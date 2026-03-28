import { describe, it, expect } from "vite-plus/test";
import {
  decideCpuAction,
  countNewlyValidCards,
  hasNoAdjacentCard,
  calcDistanceScore,
} from "@/game/cpu";
import type { NormalCard, Player, Board } from "@/types/game";
import { JOKER_CARD } from "@/game/deck";

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
    const card: NormalCard = { suit: "spades", rank: 6 };
    const hand = [card, { suit: "spades", rank: 5 } as NormalCard];
    expect(countNewlyValidCards(card, hand, board)).toBe(1);
  });

  it("新たに有効になるカードがなければ0を返す", () => {
    const board = makeBoard();
    const card: NormalCard = { suit: "spades", rank: 6 };
    const hand = [card, { suit: "hearts", rank: 5 } as NormalCard];
    expect(countNewlyValidCards(card, hand, board)).toBe(0);
  });
});

describe("hasNoAdjacentCard", () => {
  it("同スートの隣接カードがない場合はtrueを返す", () => {
    const card: NormalCard = { suit: "spades", rank: 6 };
    const hand = [card, { suit: "hearts", rank: 5 } as NormalCard];
    expect(hasNoAdjacentCard(card, hand)).toBe(true);
  });

  it("同スートの隣接カードがある場合はfalseを返す", () => {
    const card: NormalCard = { suit: "spades", rank: 6 };
    const hand = [card, { suit: "spades", rank: 5 } as NormalCard];
    expect(hasNoAdjacentCard(card, hand)).toBe(false);
  });

  it("ジョーカーは隣接カードとして扱われない", () => {
    const card: NormalCard = { suit: "spades", rank: 6 };
    const hand = [card, JOKER_CARD];
    expect(hasNoAdjacentCard(card, hand)).toBe(true);
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
    const action = decideCpuAction(player, makeBoard(), []);
    expect(action.type).toBe("place");
  });

  it("placeの場合はcardが含まれる", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 6 }] });
    const action = decideCpuAction(player, makeBoard(), []);
    if (action.type === "place") {
      expect(action.card).toEqual({ suit: "spades", rank: 6 });
    }
  });

  it("有効なカードがなくパスが残っている場合はpassを返す", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 0,
    });
    const action = decideCpuAction(player, makeBoard(), []);
    expect(action.type).toBe("pass");
  });

  it("有効なカードがなくパス上限の場合もpassを返す（手詰まり防止）", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 3,
    });
    const action = decideCpuAction(player, makeBoard(), []);
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
    const action = decideCpuAction(player, makeBoard(), []);
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

  it("ジョーカーを持ち有効なカードがない場合はplace-jokerを返す", () => {
    const player = makePlayer({
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "spades", rank: 6 }],
    });
    const action = decideCpuAction(player, makeBoard(), [humanPlayer, player]);
    expect(action.type).toBe("place-joker");
  });

  it("ジョーカーを持ちかつ有効な通常カードもある場合は通常カードを優先する", () => {
    const player = makePlayer({
      hand: [JOKER_CARD, { suit: "spades", rank: 6 }],
    });
    const action = decideCpuAction(player, makeBoard(), []);
    expect(action.type).toBe("place");
  });

  it("place-jokerの場合は人間が持つカードの位置を優先する", () => {
    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "hearts", rank: 8 }],
    });
    const board = makeBoard();
    const action = decideCpuAction(cpuPlayer, board, [humanPlayer, cpuPlayer]);
    if (action.type === "place-joker") {
      expect(action.position).toEqual({ suit: "hearts", rank: 8 });
    }
  });

  it("ジョーカーを持つが有効なジョーカー配置先がない場合はpassを返す", () => {
    const player = makePlayer({
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
    });
    const fullBoard: ReturnType<typeof makeBoard> = {
      spades: { suit: "spades", low: 1, high: 13 },
      hearts: { suit: "hearts", low: 1, high: 13 },
      diamonds: { suit: "diamonds", low: 1, high: 13 },
      clubs: { suit: "clubs", low: 1, high: 13 },
    };
    const action = decideCpuAction(player, fullBoard, []);
    expect(action.type).toBe("pass");
  });

  it("place-jokerで人間が対象カードを持たない場合は最初のpositionを選ぶ", () => {
    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "clubs", rank: 5 }],
    });
    const board = makeBoard();
    const action = decideCpuAction(cpuPlayer, board, [humanPlayer, cpuPlayer]);
    expect(action.type).toBe("place-joker");
    if (action.type === "place-joker") {
      expect(action.position).toBeDefined();
    }
  });
});
