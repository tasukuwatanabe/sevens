import { describe, it, expect } from "vite-plus/test";
import {
  isValidPlay,
  getValidCards,
  canPass,
  shouldEliminate,
  getValidJokerPositions,
  getJokerWithCardOptions,
} from "@/game/rules";
import type { Board, Card, Player, Rank } from "@/types/game";
import { JOKER_CARD } from "@/game/deck";
import { isJokerCard, isNormalCard } from "@/utils/card";

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
      low: merged.spades.low as Rank,
      high: merged.spades.high as Rank,
    },
    hearts: {
      suit: "hearts",
      low: merged.hearts.low as Rank,
      high: merged.hearts.high as Rank,
    },
    diamonds: {
      suit: "diamonds",
      low: merged.diamonds.low as Rank,
      high: merged.diamonds.high as Rank,
    },
    clubs: {
      suit: "clubs",
      low: merged.clubs.low as Rank,
      high: merged.clubs.high as Rank,
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
    expect(valid.some((c) => isNormalCard(c) && c.suit === "spades" && c.rank === 6)).toBe(true);
    expect(valid.some((c) => isNormalCard(c) && c.suit === "hearts" && c.rank === 8)).toBe(true);
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
    expect(valid.some(isJokerCard)).toBe(false);
    expect(valid).toHaveLength(1);
  });
});

describe("canPass", () => {
  function makePlayer(passesUsed: number): Player {
    return { id: "human", type: "human", name: "test", hand: [], passesUsed, eliminated: false };
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

describe("shouldEliminate", () => {
  function makePlayer(overrides: Partial<Player> = {}): Player {
    return {
      id: "human",
      type: "human",
      name: "test",
      hand: [],
      passesUsed: 3,
      eliminated: false,
      ...overrides,
    };
  }

  it("パス上限到達で出せるカードがない場合はtrue", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 3 }] });
    expect(shouldEliminate(player, makeBoard())).toBe(true);
  });

  it("パスがまだ残っている場合はfalse", () => {
    const player = makePlayer({ passesUsed: 2, hand: [{ suit: "spades", rank: 3 }] });
    expect(shouldEliminate(player, makeBoard())).toBe(false);
  });

  it("出せるカードがある場合はfalse", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 6 }] });
    expect(shouldEliminate(player, makeBoard())).toBe(false);
  });

  it("ジョーカーがあり有効な配置先がある場合はfalse", () => {
    const player = makePlayer({ hand: [JOKER_CARD] });
    expect(shouldEliminate(player, makeBoard())).toBe(false);
  });

  it("ジョーカーがあるが配置先がない場合はtrue", () => {
    const fullBoard = makeBoard({
      spades: { low: 1, high: 13 },
      hearts: { low: 1, high: 13 },
      diamonds: { low: 1, high: 13 },
      clubs: { low: 1, high: 13 },
    });
    const player = makePlayer({ hand: [JOKER_CARD] });
    expect(shouldEliminate(player, fullBoard)).toBe(true);
  });

  it("既に脱落済みの場合はfalse", () => {
    const player = makePlayer({ eliminated: true });
    expect(shouldEliminate(player, makeBoard())).toBe(false);
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

describe("getJokerWithCardOptions", () => {
  it("ジョーカーがない場合は空配列を返す", () => {
    const hand: Card[] = [{ suit: "spades", rank: 5 }];
    expect(getJokerWithCardOptions(hand, makeBoard())).toHaveLength(0);
  });

  it("ジョーカーがあってもコンボ候補がない場合は空配列を返す", () => {
    // rank: 3 は初期ボード（low=7）の low-2=5 でも high+2=9 でもないためコンボ不可
    const hand: Card[] = [JOKER_CARD, { suit: "spades", rank: 3 }];
    expect(getJokerWithCardOptions(hand, makeBoard())).toHaveLength(0);
  });

  it("high+2 のカードがある場合はコンボ候補を返す", () => {
    // high=7 → jokerPos=8, companionRank=9
    const hand: Card[] = [JOKER_CARD, { suit: "spades", rank: 9 }];
    const options = getJokerWithCardOptions(hand, makeBoard());
    expect(options).toHaveLength(1);
    expect(options[0]!.jokerPos).toEqual({ suit: "spades", rank: 8 });
    expect(options[0]!.companionCard).toEqual({ suit: "spades", rank: 9 });
  });

  it("low-2 のカードがある場合はコンボ候補を返す", () => {
    // low=7 → jokerPos=6, companionRank=5
    const hand: Card[] = [JOKER_CARD, { suit: "hearts", rank: 5 }];
    const options = getJokerWithCardOptions(hand, makeBoard());
    expect(options).toHaveLength(1);
    expect(options[0]!.jokerPos).toEqual({ suit: "hearts", rank: 6 });
    expect(options[0]!.companionCard).toEqual({ suit: "hearts", rank: 5 });
  });

  it("high=11 のとき rank13 はコンボ候補として有効（companion = high+2 = 13）", () => {
    const board = makeBoard({ spades: { low: 7, high: 11 } });
    const hand: Card[] = [JOKER_CARD, { suit: "spades", rank: 13 }];
    const options = getJokerWithCardOptions(hand, board);
    expect(options).toHaveLength(1);
    expect(options[0]!.jokerPos).toEqual({ suit: "spades", rank: 12 });
    expect(options[0]!.companionCard).toEqual({ suit: "spades", rank: 13 });
  });

  it("high=12 のときはhigh側コンボなし（companion = 14 は無効）", () => {
    const board = makeBoard({ spades: { low: 7, high: 12 } });
    const hand: Card[] = [JOKER_CARD, { suit: "spades", rank: 13 }];
    expect(getJokerWithCardOptions(hand, board)).toHaveLength(0);
  });

  it("low=3 のとき rank1 はコンボ候補として有効（companion = low-2 = 1）", () => {
    const board = makeBoard({ clubs: { low: 3, high: 7 } });
    const hand: Card[] = [JOKER_CARD, { suit: "clubs", rank: 1 }];
    const options = getJokerWithCardOptions(hand, board);
    expect(options).toHaveLength(1);
    expect(options[0]!.jokerPos).toEqual({ suit: "clubs", rank: 2 });
    expect(options[0]!.companionCard).toEqual({ suit: "clubs", rank: 1 });
  });

  it("low=2 のときはlow側コンボなし（companion = 0 は無効）", () => {
    const board = makeBoard({ clubs: { low: 2, high: 7 } });
    const hand: Card[] = [JOKER_CARD, { suit: "clubs", rank: 1 }];
    expect(getJokerWithCardOptions(hand, board)).toHaveLength(0);
  });

  it("holder が jokerPos 本体のカードを持っている場合はコンボ候補として返さない（high側）", () => {
    // 初期ボード: high=7 → jokerPos=♠8, companion=♠9
    // holder が ♠8 を持っているとジョーカーは ♠8 の代替になりえないため除外
    // (放置すると placeJokerWithCard で ♠8 が手札に残ってしまう)
    const hand: Card[] = [JOKER_CARD, { suit: "spades", rank: 8 }, { suit: "spades", rank: 9 }];
    expect(getJokerWithCardOptions(hand, makeBoard())).toHaveLength(0);
  });

  it("holder が jokerPos 本体のカードを持っている場合はコンボ候補として返さない（low側）", () => {
    // 初期ボード: low=7 → jokerPos=♣6, companion=♣5
    // holder が ♣6 を持っているためコンボ候補から除外
    const hand: Card[] = [JOKER_CARD, { suit: "clubs", rank: 6 }, { suit: "clubs", rank: 5 }];
    expect(getJokerWithCardOptions(hand, makeBoard())).toHaveLength(0);
  });

  it("別スートで holder が jokerPos を持っていても、影響のないスートのコンボは返す", () => {
    // ♠ では holder が ♠8 を持っているためコンボ除外
    // ♥ ではコンボが成立する（holder は ♥8 を持っていない）
    const hand: Card[] = [
      JOKER_CARD,
      { suit: "spades", rank: 8 },
      { suit: "spades", rank: 9 },
      { suit: "hearts", rank: 9 },
    ];
    const options = getJokerWithCardOptions(hand, makeBoard());
    expect(options).toHaveLength(1);
    expect(options[0]!.jokerPos).toEqual({ suit: "hearts", rank: 8 });
    expect(options[0]!.companionCard).toEqual({ suit: "hearts", rank: 9 });
  });
});
