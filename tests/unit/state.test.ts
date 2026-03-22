import { describe, it, expect } from "vite-plus/test";
import { initGame, placeCard, passTurn } from "@/game/state";
import type { Card } from "@/types/game";

describe("initGame", () => {
  it("4人のプレイヤーがいる", () => {
    const state = initGame();
    expect(state.players).toHaveLength(4);
  });

  it("各プレイヤーが12枚の手札を持つ（7を除いた48枚÷4）", () => {
    const state = initGame();
    for (const player of state.players) {
      expect(player.hand).toHaveLength(12);
    }
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
      expect(player.hand.some((c) => c.rank === 7)).toBe(false);
    }
  });
});

describe("placeCard", () => {
  it("手札からカードが減る", () => {
    const state = initGame();
    const player = state.players[0]!;
    const validCard = player.hand.find((c) => {
      const row = state.board[c.suit];
      return c.rank === row.low - 1 || c.rank === row.high + 1;
    });
    if (!validCard) return;

    const next = placeCard(state, validCard);
    expect(next.players[0]!.hand).toHaveLength(11);
  });

  it("ボードが更新される", () => {
    const state = initGame();
    const card: Card = { suit: "spades", rank: 6 };
    state.players[0]!.hand.push(card);
    const next = placeCard(state, card);
    expect(next.board.spades.low).toBe(6);
  });

  it("ターンが次のプレイヤーに移る", () => {
    const state = initGame();
    const card: Card = { suit: "spades", rank: 6 };
    state.players[0]!.hand.push(card);
    const next = placeCard(state, card);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it("最後のプレイヤーのターン後はindex 0に戻る", () => {
    const state = { ...initGame(), currentPlayerIndex: 3 };
    const card: Card = { suit: "spades", rank: 6 };
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
