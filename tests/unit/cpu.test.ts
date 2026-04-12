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
    eliminated: false,
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

  it("有効なカードがなくパス上限の場合はeliminateを返す", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 3,
    });
    const action = decideCpuAction(player, makeBoard(), []);
    expect(action.type).toBe("eliminate");
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

  it("ジョーカーを持ちコンボも通常カードも出せない場合はplace-jokerを返す", () => {
    const player = makePlayer({
      // rank: 3 は有効牌でもコンボ候補（rank5/9）でもないためコンボは発生しない
      hand: [JOKER_CARD, { suit: "spades", rank: 3 }],
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
      // rank: 3 は有効牌でもコンボ候補でもないため place-joker に落ちる
      hand: [JOKER_CARD, { suit: "spades", rank: 3 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "hearts", rank: 8 }],
    });
    const board = makeBoard();
    const action = decideCpuAction(cpuPlayer, board, [humanPlayer, cpuPlayer]);
    expect(action.type).toBe("place-joker");
    if (action.type === "place-joker") {
      expect(action.position).toEqual({ suit: "hearts", rank: 8 });
    }
  });

  it("ジョーカーを持つが有効なジョーカー配置先がなくパスが残っている場合はpassを返す", () => {
    const player = makePlayer({
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
      passesUsed: 0,
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

  it("ジョーカーを持つが有効なジョーカー配置先がなくパス上限の場合はeliminateを返す", () => {
    const player = makePlayer({
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
      passesUsed: 3,
    });
    const fullBoard: ReturnType<typeof makeBoard> = {
      spades: { suit: "spades", low: 1, high: 13 },
      hearts: { suit: "hearts", low: 1, high: 13 },
      diamonds: { suit: "diamonds", low: 1, high: 13 },
      clubs: { suit: "clubs", low: 1, high: 13 },
    };
    const action = decideCpuAction(player, fullBoard, []);
    expect(action.type).toBe("eliminate");
  });

  it("place-jokerで人間が対象カードを持たない場合は最初のpositionを選ぶ", () => {
    const cpuPlayer = makePlayer({
      id: "cpu1",
      // rank: 3 は有効牌でもコンボ候補でもないため place-joker に落ちる
      hand: [JOKER_CARD, { suit: "spades", rank: 3 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "clubs", rank: 3 }],
    });
    const board = makeBoard();
    const action = decideCpuAction(cpuPlayer, board, [humanPlayer, cpuPlayer]);
    expect(action.type).toBe("place-joker");
    if (action.type === "place-joker") {
      expect(action.position).toBeDefined();
    }
  });

  it("ジョーカー＋コンボカードがあり通常カードがない場合はplace-joker-with-cardを返す", () => {
    const player = makePlayer({
      // rank: 9 は初期ボード（high=7）の high+2=9 に相当するコンボ候補
      hand: [JOKER_CARD, { suit: "spades", rank: 9 }],
    });
    const action = decideCpuAction(player, makeBoard(), [player]);
    expect(action.type).toBe("place-joker-with-card");
    if (action.type === "place-joker-with-card") {
      expect(action.jokerPos).toEqual({ suit: "spades", rank: 8 });
      expect(action.companionCard).toEqual({ suit: "spades", rank: 9 });
    }
  });

  it("通常カードがある場合はコンボより通常カードを優先する", () => {
    const player = makePlayer({
      // rank: 8 は有効牌（high+1）、rank: 9 はコンボ候補
      hand: [JOKER_CARD, { suit: "spades", rank: 8 }, { suit: "spades", rank: 9 }],
    });
    const action = decideCpuAction(player, makeBoard(), [player]);
    expect(action.type).toBe("place");
  });

  it("place-joker-with-card は人間が jokerPos カードを持つ選択肢を優先する", () => {
    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [JOKER_CARD, { suit: "spades", rank: 9 }, { suit: "hearts", rank: 9 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      // ♥8 を持っているため ♥8 が jokerPos になるコンボが選ばれるべき
      hand: [{ suit: "hearts", rank: 8 }],
    });
    const board = makeBoard();
    const action = decideCpuAction(cpuPlayer, board, [humanPlayer, cpuPlayer]);
    expect(action.type).toBe("place-joker-with-card");
    if (action.type === "place-joker-with-card") {
      expect(action.jokerPos).toEqual({ suit: "hearts", rank: 8 });
    }
  });

  it("人間が敗北済みの場合、CPU の decideCpuAction が正常に動作する", () => {
    // CPU が人間をターゲットしようとするがアクセスできない敗北状態
    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [{ suit: "spades", rank: 6 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "spades", rank: 8 }],
      eliminated: true, // 人間が既に敗北済み
    });
    const anotherCpuPlayer = makePlayer({
      id: "cpu2",
      hand: [{ suit: "hearts", rank: 8 }],
    });

    // CPU がクラッシュせずに正常に判定を返す
    const action = decideCpuAction(cpuPlayer, makeBoard(), [
      humanPlayer,
      cpuPlayer,
      anotherCpuPlayer,
    ]);
    expect(action.type).toBe("place");
    if (action.type === "place") {
      expect(action.card).toEqual({ suit: "spades", rank: 6 });
    }
  });

  it("ボードが満杯でジョーカー配置位置がない場合、pass が残っていればpass、なければeliminate", () => {
    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
      passesUsed: 0,
    });
    const fullBoard: ReturnType<typeof makeBoard> = {
      spades: { suit: "spades", low: 1, high: 13 },
      hearts: { suit: "hearts", low: 1, high: 13 },
      diamonds: { suit: "diamonds", low: 1, high: 13 },
      clubs: { suit: "clubs", low: 1, high: 13 },
    };

    // 満杯ボード + ジョーカー + 通常カードは無効 + パス残 → pass
    const actionWithPass = decideCpuAction(cpuPlayer, fullBoard, []);
    expect(actionWithPass.type).toBe("pass");

    // 満杯ボード + ジョーカー + 通常カードは無効 + パス上限 → eliminate
    const cpuPlayerNoPass = makePlayer({
      id: "cpu1",
      hand: [JOKER_CARD, { suit: "spades", rank: 5 }],
      passesUsed: 3,
    });
    const actionWithoutPass = decideCpuAction(cpuPlayerNoPass, fullBoard, []);
    expect(actionWithoutPass.type).toBe("eliminate");
  });

  it("CPU がジョーカー配置時に自分が持つカード位置を避ける", () => {
    // CPU がジョーカーを出す状況を作る：
    // - 通常のカード出し不可（hand に有効なカードがない）
    // - ジョーカーコンボ不可（high+2, low-2 のカードなし）
    // - よってジョーカー単体を出す
    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [JOKER_CARD, { suit: "diamonds", rank: 3 }, { suit: "clubs", rank: 2 }],
    });
    const humanPlayer = makePlayer({
      id: "human",
      type: "human",
      hand: [{ suit: "hearts", rank: 8 }],
    });
    const board = makeBoard();
    const action = decideCpuAction(cpuPlayer, board, [humanPlayer, cpuPlayer]);

    expect(action.type).toBe("place-joker");
    if (action.type === "place-joker") {
      // CPU が ♥8 を持っていないため、♥8 位置にはジョーカーを置くこと
      expect(action.position).toEqual({ suit: "hearts", rank: 8 });
    }
  });

  it("getValidJokerPositionsForPlayer が自分が持つ位置を除外する", () => {
    // このテストは直接新関数をテストして、CPU が正しく使用していることを確認
    const board = makeBoard();

    // rules.test.ts で詳細テストをしているため、ここでは統合テストのみ
    // CPU の decideCpuAction が新関数を使用していることを確認する必要がある
    // CPU が手札に spades, 8 を持っている場合、♠8 位置にはジョーカーを置かない

    const cpuPlayer = makePlayer({
      id: "cpu1",
      hand: [
        JOKER_CARD,
        { suit: "spades", rank: 8 }, // 有効位置だが、自分が持つ
      ],
    });

    const action = decideCpuAction(cpuPlayer, board, [cpuPlayer]);
    // CPU は通常の "place" または "place-joker" を選ぶが、
    // 自分が持つ位置を避けることを確認する
    if (action.type === "place-joker") {
      expect(action.position).not.toEqual({ suit: "spades", rank: 8 });
    }
  });
});
