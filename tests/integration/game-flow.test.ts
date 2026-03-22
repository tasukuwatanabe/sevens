import { describe, it, expect } from "vitest";
import { initGame, placeCard, passTurn } from "@/game/state";
import { getValidCards, canPass } from "@/game/rules";
import { decideCpuAction } from "@/game/cpu";
import type { GameState } from "@/types/game";
import { SUITS } from "@/game/constants";

function playUntilEnd(state: GameState, maxTurns = 2000): GameState {
  let current = state;
  let turns = 0;

  while (current.phase === "playing" && turns < maxTurns) {
    const player = current.players[current.currentPlayerIndex]!;
    const valid = getValidCards(player.hand, current.board);

    if (valid.length > 0) {
      const action = decideCpuAction(player, current.board);
      if (action.type === "place") {
        current = placeCard(current, action.card);
      } else {
        current = passTurn(current);
      }
    } else {
      current = passTurn(current);
    }

    turns++;
  }

  return current;
}

describe("ゲームフロー統合テスト", () => {
  it("ゲームが正常に開始できる", () => {
    const state = initGame();
    expect(state.phase).toBe("playing");
    expect(state.players).toHaveLength(4);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("ボードの初期状態はすべてのスートが7だけ", () => {
    const state = initGame();
    for (const suit of SUITS) {
      expect(state.board[suit].low).toBe(7);
      expect(state.board[suit].high).toBe(7);
    }
  });

  it("手番を1回すすめるとプレイヤーが変わる", () => {
    const state = initGame();
    const player = state.players[0]!;
    const valid = getValidCards(player.hand, state.board);

    if (valid.length > 0) {
      const next = placeCard(state, valid[0]!);
      expect(next.currentPlayerIndex).toBe(1);
    } else {
      const next = passTurn(state);
      expect(next.currentPlayerIndex).toBe(1);
      expect(next.players[0]!.passesUsed).toBe(1);
    }
  });

  it("ゲームを最後まで進めると必ず勝者が出る", () => {
    const state = initGame();
    const final = playUntilEnd(state);
    expect(final.phase).toBe("gameover");
    expect(final.winner).not.toBeNull();
  });

  it("勝者の手札は0枚", () => {
    const state = initGame();
    const final = playUntilEnd(state);
    if (final.winner) {
      const winner = final.players.find((p) => p.id === final.winner);
      expect(winner!.hand).toHaveLength(0);
    }
  });

  it("パスは各プレイヤー3回まで", () => {
    let state = initGame();
    for (let i = 0; i < 4 * 3; i++) {
      state = passTurn(state);
    }
    for (const player of state.players) {
      expect(player.passesUsed).toBe(3);
      expect(canPass(player)).toBe(false);
    }
  });

  it("ゲームリセットで新しいゲームが始まる", () => {
    let state = initGame();
    state = passTurn(state);
    state = passTurn(state);

    const fresh = initGame();
    expect(fresh.players[0]!.passesUsed).toBe(0);
    expect(fresh.phase).toBe("playing");
  });
});
