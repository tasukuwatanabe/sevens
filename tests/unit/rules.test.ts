import { describe, it, expect } from "vite-plus/test";
import { isValidPlay, getValidCards, canPass, getValidJokerPositions } from "@/game/rules";
import type { Board, Player } from "@/types/game";
import { JOKER_CARD } from "@/game/deck";

function makeBoard(overrides: Partial<Record<string, { low: number; high: number }>> = {}): Board {
  const defaults = {
    spades: { low: 7, high: 7 },
    hearts: { low: 7, high: 7 },
    diamonds: { low: 7, high: 7 },
    clubs: { low: 7, high: 7 },
  };
  const merged = { ...defaults, ...overrides };
  return {
    spades: {
      suit: "spades",
      low: merged.spades.low as any,
      high: merged.spades.high as any,
    },
    hearts: {
      suit: "hearts",
      low: merged.hearts.low as any,
      high: merged.hearts.high as any,
    },
    diamonds: {
      suit: "diamonds",
      low: merged.diamonds.low as any,
      high: merged.diamonds.high as any,
    },
    clubs: {
      suit: "clubs",
      low: merged.clubs.low as any,
      high: merged.clubs.high as any,
    },
  };
}

describe("isValidPlay", () => {
  it("7の左隣（6）は置ける", () => {
    const board = makeBoard();
    expect(isValidPlay({ suit: "spades", rank: 6 }, board)).toBe(true);
  });

  it("7の右隣（8）は置ける", () => {
    const board = makeBoard();
    expect(isValidPlay({ suit: "spades", rank: 8 }, board)).toBe(true);
  });

  it("7自体は置けない（初期状態）", () => {
    const board = makeBoard();
    expect(isValidPlay({ suit: "spades", rank: 7 }, board)).toBe(false);
  });

  it("離れたランクは置けない", () => {
    const board = makeBoard();
    expect(isValidPlay({ suit: "spades", rank: 5 }, board)).toBe(false);
    expect(isValidPlay({ suit: "spades", rank: 9 }, board)).toBe(false);
  });

  it("low=1の時、0は置けない", () => {
    const board = makeBoard({ spades: { low: 1, high: 7 } });
    expect(isValidPlay({ suit: "spades", rank: 1 }, board)).toBe(false);
  });

  it("high=13の時、14は置けない", () => {
    const board = makeBoard({ spades: { low: 7, high: 13 } });
    expect(isValidPlay({ suit: "spades", rank: 13 }, board)).toBe(false);
  });

  it("low=3の時、2は置ける", () => {
    const board = makeBoard({ hearts: { low: 3, high: 7 } });
    expect(isValidPlay({ suit: "hearts", rank: 2 }, board)).toBe(true);
  });

  it("異なるスートは影響しない", () => {
    const board = makeBoard({ spades: { low: 5, high: 9 } });
    expect(isValidPlay({ suit: "hearts", rank: 6 }, board)).toBe(true);
    expect(isValidPlay({ suit: "hearts", rank: 8 }, board)).toBe(true);
  });

  it("ジョーカーは通常のisValidPlayでは置けない", () => {
    const board = makeBoard();
    expect(isValidPlay(JOKER_CARD, board)).toBe(false);
  });
});

describe("getValidCards", () => {
  it("有効なカードのみ返す", () => {
    const board = makeBoard();
    const hand = [
      { suit: "spades" as const, rank: 6 as const },
      { suit: "spades" as const, rank: 5 as const },
      { suit: "hearts" as const, rank: 8 as const },
    ];
    const valid = getValidCards(hand, board);
    expect(valid).toHaveLength(2);
    expect(valid.some((c) => (c as any).suit === "spades" && (c as any).rank === 6)).toBe(true);
    expect(valid.some((c) => (c as any).suit === "hearts" && (c as any).rank === 8)).toBe(true);
  });

  it("有効なカードがない場合は空配列", () => {
    const board = makeBoard();
    const hand = [{ suit: "spades" as const, rank: 5 as const }];
    expect(getValidCards(hand, board)).toHaveLength(0);
  });

  it("ジョーカーは有効なカードとして返さない", () => {
    const board = makeBoard();
    const hand = [JOKER_CARD, { suit: "spades" as const, rank: 6 as const }];
    const valid = getValidCards(hand, board);
    expect(valid.some((c) => (c as any).isJoker)).toBe(false);
    expect(valid).toHaveLength(1);
  });
});

describe("canPass", () => {
  function makePlayer(passesUsed: number): Player {
    return { id: "human", type: "human", name: "test", hand: [], passesUsed };
  }

  it("パス未使用なら可能", () => {
    expect(canPass(makePlayer(0))).toBe(true);
  });

  it("2回使用でも可能", () => {
    expect(canPass(makePlayer(2))).toBe(true);
  });

  it("3回使用で不可", () => {
    expect(canPass(makePlayer(3))).toBe(false);
  });
});

describe("getValidJokerPositions", () => {
  it("初期ボードでは8位置（各スート2箇所）を返す", () => {
    const board = makeBoard();
    const positions = getValidJokerPositions(board);
    expect(positions).toHaveLength(8);
  });

  it("low=1のスートは左側の位置がない", () => {
    const board = makeBoard({ spades: { low: 1, high: 7 } });
    const positions = getValidJokerPositions(board);
    const spadesPositions = positions.filter((p) => p.suit === "spades");
    expect(spadesPositions).toHaveLength(1);
    expect(spadesPositions[0]!.rank).toBe(8);
  });

  it("high=13のスートは右側の位置がない", () => {
    const board = makeBoard({ hearts: { low: 7, high: 13 } });
    const positions = getValidJokerPositions(board);
    const heartsPositions = positions.filter((p) => p.suit === "hearts");
    expect(heartsPositions).toHaveLength(1);
    expect(heartsPositions[0]!.rank).toBe(6);
  });

  it("返す位置はすべてNormalCard形式", () => {
    const board = makeBoard();
    const positions = getValidJokerPositions(board);
    for (const pos of positions) {
      expect(pos.suit).toBeDefined();
      expect(pos.rank).toBeDefined();
    }
  });

  it("low=1かつhigh=13のスートは位置を返さない", () => {
    const board = makeBoard({ spades: { low: 1, high: 13 } });
    const positions = getValidJokerPositions(board);
    expect(positions.filter((p) => p.suit === "spades")).toHaveLength(0);
  });

  it("全スートが完全に埋まった場合は空配列", () => {
    const board = makeBoard({
      spades: { low: 1, high: 13 },
      hearts: { low: 1, high: 13 },
      diamonds: { low: 1, high: 13 },
      clubs: { low: 1, high: 13 },
    });
    expect(getValidJokerPositions(board)).toHaveLength(0);
  });
});
