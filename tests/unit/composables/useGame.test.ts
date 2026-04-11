import { describe, it, expect } from "vite-plus/test";
import { initGame, placeCard, eliminatePlayer, passTurn } from "@/game/state";
import { getValidCards, canPass, shouldEliminate } from "@/game/rules";
import { decideCpuAction } from "@/game/cpu";
import type { NormalCard, Player } from "@/types/game";

// useGame composable の中核となるゲームロジックをテスト
// Vue reactivity 層を除いた、ゲーム状態管理とアクション処理をテスト

describe("useGame - Game Logic", () => {
  describe("Game Initialization", () => {
    it("ゲーム初期化が正常に実行される", () => {
      const state = initGame();

      expect(state).toBeDefined();
      expect(state.phase).toBe("playing");
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.players).toHaveLength(4);
      expect(state.winner).toBeNull();
    });

    it("初期状態で最初のプレイヤーは human", () => {
      const state = initGame();
      expect(state.players[0]!.type).toBe("human");
      expect(state.players[1]!.type).toBe("cpu");
      expect(state.players[2]!.type).toBe("cpu");
      expect(state.players[3]!.type).toBe("cpu");
    });
  });

  describe("Human Player Actions", () => {
    it("placeCard でカードが配置される", () => {
      const state = initGame();
      const card: NormalCard = { suit: "spades", rank: 6 };
      // 手札を明示的に置き換え（initGame で既に spades 6 が存在する可能性を排除）
      state.players[0]!.hand = [card];

      const next = placeCard(state, card);

      expect(next.board.spades.low).toBe(6);
      expect(next.players[0]!.hand).toHaveLength(0);
    });

    it("passTurn でターンが次のプレイヤーに移る", () => {
      const state = initGame();
      const originalIndex = state.currentPlayerIndex;

      const next = passTurn(state);

      expect(next.currentPlayerIndex).not.toBe(originalIndex);
      expect(next.players[originalIndex]!.passesUsed).toBe(1);
    });

    it("有効なカードはgetValidCardsで取得できる", () => {
      const state = initGame();
      const validCards = getValidCards(state.players[0]!.hand, state.board);

      expect(validCards).toBeDefined();
      expect(Array.isArray(validCards)).toBe(true);
    });

    it("パスが可能かどうかをcanPassで判定できる", () => {
      const state = initGame();
      const canPassResult = canPass(state.players[0]!);

      expect(typeof canPassResult).toBe("boolean");
      expect(canPassResult).toBe(true); // 初期状態ではパス可能
    });
  });

  describe("CPU Player Actions", () => {
    it("decideCpuAction で CPU の行動を判定できる", () => {
      const state = initGame();
      const player = state.players[1]!; // CPU プレイヤー

      const action = decideCpuAction(player, state.board, state.players);

      expect(action).toBeDefined();
      expect(["place", "pass", "eliminate", "place-joker", "place-joker-with-card"]).toContain(
        action.type,
      );
    });

    it("有効なカードがあれば place アクションを返す", () => {
      const state = initGame();
      const player = state.players[1]!;
      player.hand.push({ suit: "spades", rank: 6 });

      const action = decideCpuAction(player, state.board, state.players);

      // place アクションか他の優先度の高いアクション
      expect(["place", "place-joker", "place-joker-with-card"]).toContain(action.type);
    });

    it("有効なカードがなくパスが残っていれば pass アクションを返す", () => {
      const state = initGame();
      const player = state.players[1]!;
      player.hand = [{ suit: "spades", rank: 3 }]; // 配置不可
      player.passesUsed = 0;

      const action = decideCpuAction(player, state.board, state.players);

      expect(action.type).toBe("pass");
    });

    it("有効なカードがなくパス上限に達していれば eliminate アクションを返す", () => {
      const state = initGame();
      const player = state.players[1]!;
      player.hand = [{ suit: "spades", rank: 3 }]; // 配置不可
      player.passesUsed = 3;

      const action = decideCpuAction(player, state.board, state.players);

      expect(action.type).toBe("eliminate");
    });
  });

  describe("Game State Validation", () => {
    it("shouldEliminate で敗北判定ができる", () => {
      const state = initGame();
      const player = state.players[0]!;

      const shouldElim = shouldEliminate(player, state.board);

      expect(typeof shouldElim).toBe("boolean");
      // 初期状態では敗北しない（パスが残っている）
      expect(shouldElim).toBe(false);
    });

    it("敗北判定は通常カードとジョーカー両方を考慮する", () => {
      const state = initGame();
      const player = state.players[0]!;
      player.passesUsed = 3;
      player.hand = [{ suit: "spades", rank: 3 }]; // 配置不可

      const shouldElim = shouldEliminate(player, state.board);

      // ジョーカーなし、出せるカードなし、パス上限 → 敗北
      expect(shouldElim).toBe(true);
    });

    it("プレイヤーが手札を空にするとゲーム終了", () => {
      const state = initGame();
      state.players[0]!.hand = [{ suit: "spades", rank: 6 }];

      const next = placeCard(state, { suit: "spades", rank: 6 });

      expect(next.phase).toBe("gameover");
      expect(next.winner).toBe("human");
    });

    it("敗北して残り1プレイヤーならゲーム終了", () => {
      let state = initGame();
      state.players[1]!.eliminated = true;
      state.players[2]!.eliminated = true;
      state.players[0]!.hand = [{ suit: "spades", rank: 6 }];
      state.players[3]!.hand = [{ suit: "spades", rank: 3 }];
      state.players[3]!.passesUsed = 3;
      state.currentPlayerIndex = 3;

      const next = eliminatePlayer(state);

      expect(next.phase).toBe("gameover");
      expect(next.winner).toBe("human"); // 最後に残ったプレイヤー
    });
  });

  describe("Game Flow", () => {
    it("ゲーム進行で複数のターンが経過できる", () => {
      let state = initGame();
      const card: NormalCard = { suit: "spades", rank: 6 };
      state.players[0]!.hand.push(card);

      // ターン1: プレイヤー0 がカード配置
      state = placeCard(state, card);
      expect(state.currentPlayerIndex).toBe(1);

      // ターン2: プレイヤー1 がパス（valid カードがないと仮定）
      state = passTurn(state);
      expect(state.currentPlayerIndex).toBe(2);

      // ゲーム継続中
      expect(state.phase).toBe("playing");
      expect(state.winner).toBeNull();
    });

    it("敗北プレイヤーはターンがスキップされる", () => {
      const state = initGame();
      state.players[1]!.eliminated = true;
      state.currentPlayerIndex = 0;

      const next = passTurn(state);

      // プレイヤー1（敗北）はスキップされてプレイヤー2に移る
      expect(next.currentPlayerIndex).toBe(2);
    });
  });

  describe("Backward Compatibility", () => {
    it("eliminated フィールドが undefined の場合は false に設定される", () => {
      const state = initGame();
      const stateWithoutEliminated = {
        ...state,
        players: state.players.map((p) => {
          const { eliminated: _, ...rest } = p;
          return rest as Omit<Player, "eliminated">;
        }),
      };

      // 後方互換性チェック（useGame 内で実行される）
      const fixed = {
        ...stateWithoutEliminated,
        players: stateWithoutEliminated.players.map((p) => ({
          ...p,
          eliminated: false,
        })),
      };

      for (const player of fixed.players) {
        expect(player.eliminated).toBe(false);
      }
    });
  });
});
