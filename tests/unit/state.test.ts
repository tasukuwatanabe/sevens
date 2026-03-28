import { describe, it, expect } from "vite-plus/test";
import { initGame, placeCard, placeJoker, passTurn } from "@/game/state";
import { getValidCards } from "@/game/rules";
import { isJokerCard } from "@/utils/card";
import type { NormalCard } from "@/types/game";
import { JOKER_CARD } from "@/game/deck";

describe("initGame", () => {
  it("4人のプレイヤーがいる", () => {
    const state = initGame();
    expect(state.players).toHaveLength(4);
  });

  it("手札の合計が49枚（7を除いた49枚）", () => {
    const state = initGame();
    const total = state.players.reduce((sum, p) => sum + p.hand.length, 0);
    expect(total).toBe(49);
  });

  it("player[0]が13枚、残りが12枚", () => {
    const state = initGame();
    expect(state.players[0]!.hand.length).toBe(13);
    expect(state.players[1]!.hand.length).toBe(12);
    expect(state.players[2]!.hand.length).toBe(12);
    expect(state.players[3]!.hand.length).toBe(12);
  });

  it("ボードの初期値はすべて7", () => {
    const state = initGame();
    for (const suit of ["spades", "hearts", "diamonds", "clubs"] as const) {
      expect(state.board[suit].low).toBe(7);
      expect(state.board[suit].high).toBe(7);
    }
  });

  it("phaseはplaying", () => {
    expect(initGame().phase).toBe("playing");
  });

  it("最初のプレイヤーはhuman（index 0）", () => {
    expect(initGame().currentPlayerIndex).toBe(0);
  });

  it("手札に7が含まれない", () => {
    const state = initGame();
    for (const player of state.players) {
      expect(player.hand.some((c) => !isJokerCard(c) && (c as NormalCard).rank === 7)).toBe(false);
    }
  });

  it("全手札にジョーカーが合計1枚含まれる", () => {
    const state = initGame();
    const jokers = state.players.flatMap((p) => p.hand.filter(isJokerCard));
    expect(jokers).toHaveLength(1);
  });
});

describe("placeCard", () => {
  it("手札からカードが減る", () => {
    const state = initGame();
    const player = state.players[0]!;
    const validCards = getValidCards(player.hand, state.board) as NormalCard[];
    if (validCards.length === 0) return;

    const next = placeCard(state, validCards[0]!);
    expect(next.players[0]!.hand).toHaveLength(12);
  });

  it("ボードが更新される", () => {
    const state = initGame();
    const card: NormalCard = { suit: "spades", rank: 6 };
    state.players[0]!.hand.push(card);
    const next = placeCard(state, card);
    expect(next.board.spades.low).toBe(6);
  });

  it("ターンが次のプレイヤーに移る", () => {
    const state = initGame();
    const card: NormalCard = { suit: "spades", rank: 6 };
    state.players[0]!.hand.push(card);
    const next = placeCard(state, card);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it("最後のプレイヤーのターン後はindex 0に戻る", () => {
    const state = { ...initGame(), currentPlayerIndex: 3 };
    const card: NormalCard = { suit: "spades", rank: 6 };
    state.players[3]!.hand.push(card);
    const next = placeCard(state, card);
    expect(next.currentPlayerIndex).toBe(0);
  });

  it("手札が空になるとgameoverになる", () => {
    const state = initGame();
    state.players[0]!.hand = [{ suit: "spades", rank: 6 }];
    const next = placeCard(state, { suit: "spades", rank: 6 });
    expect(next.phase).toBe("gameover");
    expect(next.winner).toBe("human");
  });
});

describe("placeJoker", () => {
  it("ジョーカーを持つプレイヤーの手札からジョーカーが消える", () => {
    const state = initGame();
    const holderIndex = state.players.findIndex((p) => p.hand.some(isJokerCard));
    if (holderIndex === -1) return;

    const targetPos = { suit: "spades" as const, rank: 6 as const };
    const recipient = state.players.find(
      (p, i) =>
        i !== holderIndex &&
        p.hand.some(
          (c) =>
            !isJokerCard(c) && (c as NormalCard).suit === "spades" && (c as NormalCard).rank === 6,
        ),
    );
    if (!recipient) return;

    const stateWithHolder = { ...state, currentPlayerIndex: holderIndex };
    const next = placeJoker(stateWithHolder, targetPos);

    const newHolder = next.players[holderIndex]!;
    expect(newHolder.hand.some(isJokerCard)).toBe(false);
  });

  it("ターゲットの本来のカードを持つプレイヤーがジョーカーを受け取る", () => {
    const state = initGame();
    const card: NormalCard = { suit: "hearts", rank: 6 };

    state.players[1]!.hand = [card];
    state.players[0]!.hand = [JOKER_CARD, { suit: "spades", rank: 6 }];

    const next = placeJoker(state, card);

    expect(next.players[1]!.hand.some(isJokerCard)).toBe(true);
    expect(
      next.players[1]!.hand.some(
        (c) =>
          !isJokerCard(c) && (c as NormalCard).suit === "hearts" && (c as NormalCard).rank === 6,
      ),
    ).toBe(false);
  });

  it("ターゲット位置でボードが更新される", () => {
    const state = initGame();
    const targetPos: NormalCard = { suit: "spades", rank: 6 };

    state.players[0]!.hand = [JOKER_CARD];
    state.players[1]!.hand = [targetPos];

    const next = placeJoker(state, targetPos);
    expect(next.board.spades.low).toBe(6);
  });

  it("ジョーカーを出して手札が空になると勝利", () => {
    const state = initGame();
    state.players[0]!.hand = [JOKER_CARD];
    state.players[1]!.hand = [{ suit: "spades", rank: 6 }];

    const next = placeJoker(state, { suit: "spades", rank: 6 });
    expect(next.phase).toBe("gameover");
    expect(next.winner).toBe("human");
  });

  it("ターンが次のプレイヤーに移る", () => {
    const state = initGame();
    state.players[0]!.hand = [JOKER_CARD, { suit: "spades", rank: 1 }];
    state.players[1]!.hand = [{ suit: "spades", rank: 6 }];

    const next = placeJoker(state, { suit: "spades", rank: 6 });
    expect(next.currentPlayerIndex).toBe(1);
  });

  it("ターゲットのカードを誰も持っていない場合もボードは更新される", () => {
    const state = initGame();
    state.players[0]!.hand = [JOKER_CARD];
    state.players[1]!.hand = [];
    state.players[2]!.hand = [];
    state.players[3]!.hand = [];

    const next = placeJoker(state, { suit: "spades", rank: 6 });
    expect(next.board.spades.low).toBe(6);
    expect(next.players[0]!.hand.some(isJokerCard)).toBe(false);
  });

  it("ジョーカーを出しても手札が残る場合はgameoverにならない", () => {
    const state = initGame();
    state.players[0]!.hand = [JOKER_CARD, { suit: "clubs", rank: 1 }];
    state.players[1]!.hand = [{ suit: "spades", rank: 6 }];

    const next = placeJoker(state, { suit: "spades", rank: 6 });
    expect(next.phase).toBe("playing");
    expect(next.winner).toBeNull();
  });
});

describe("passTurn", () => {
  it("passesUsedが増える", () => {
    const state = initGame();
    const next = passTurn(state);
    expect(next.players[0]!.passesUsed).toBe(1);
  });

  it("ターンが次のプレイヤーに移る", () => {
    const state = initGame();
    const next = passTurn(state);
    expect(next.currentPlayerIndex).toBe(1);
  });
});
