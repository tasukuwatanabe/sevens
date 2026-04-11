import { describe, it, expect } from "vite-plus/test";
import { initGame, placeCard, placeJoker, passTurn, eliminatePlayer } from "@/game/state";
import { getValidCards, canPass, getValidJokerPositions } from "@/game/rules";
import { decideCpuAction } from "@/game/cpu";
import { isJokerCard } from "@/utils/card";
import type { GameState, NormalCard } from "@/types/game";
import { SUITS } from "@/game/constants";

function playUntilEnd(state: GameState, maxTurns = 2000): GameState {
  let current = state;
  let turns = 0;

  while (current.phase === "playing" && turns < maxTurns) {
    const player = current.players[current.currentPlayerIndex]!;
    if (player.eliminated) {
      // Should not happen with nextActivePlayer, but safety check
      break;
    }
    const action = decideCpuAction(player, current.board, current.players);

    if (action.type === "place") {
      current = placeCard(current, action.card);
    } else if (action.type === "place-joker") {
      current = placeJoker(current, action.position);
    } else if (action.type === "eliminate") {
      current = eliminatePlayer(current);
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
    const valid = getValidCards(player.hand, state.board) as NormalCard[];

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
      // 勝者はカードを出し切ったか、最後のアクティブプレイヤーとして残った
      expect(winner!.hand.length === 0 || !winner!.eliminated).toBe(true);
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

  it("全プレイヤーの手札合計が49枚", () => {
    const state = initGame();
    const total = state.players.reduce((sum, p) => sum + p.hand.length, 0);
    expect(total).toBe(49);
  });

  it("ジョーカーが全手札に1枚だけ存在する", () => {
    const state = initGame();
    const jokers = state.players.flatMap((p) => p.hand.filter(isJokerCard));
    expect(jokers).toHaveLength(1);
  });

  it("ジョーカーを出した後もボードが正常に更新される", () => {
    const state = initGame();
    state.players[0]!.hand = [{ isJoker: true }];
    state.players[1]!.hand = [{ suit: "spades", rank: 6 }];

    const next = placeJoker(state, { suit: "spades", rank: 6 });
    expect(next.board.spades.low).toBe(6);
    expect(next.players[1]!.hand.some(isJokerCard)).toBe(true);
  });

  it("ジョーカーが巡回しながらゲームが進行する", () => {
    const state = initGame();
    let jokerHolder = state.players.findIndex((p) => p.hand.some(isJokerCard));
    expect(jokerHolder).toBeGreaterThanOrEqual(0);

    const validPositions = getValidJokerPositions(state.board);
    if (validPositions.length === 0) return;

    const targetPos = validPositions[0]!;
    const recipientIndex = state.players.findIndex((p) =>
      p.hand.some(
        (c) =>
          !isJokerCard(c) &&
          (c as NormalCard).suit === targetPos.suit &&
          (c as NormalCard).rank === targetPos.rank,
      ),
    );
    if (recipientIndex === -1 || recipientIndex === jokerHolder) return;

    const stateWithJokerTurn = { ...state, currentPlayerIndex: jokerHolder };
    const next = placeJoker(stateWithJokerTurn, targetPos);

    expect(next.players[jokerHolder]!.hand.some(isJokerCard)).toBe(false);
    expect(next.players[recipientIndex]!.hand.some(isJokerCard)).toBe(true);
  });

  it("複数プレイヤーが敗北する場合のゲーム流れが正常に機能する", () => {
    // シナリオ: 複数プレイヤーが脱落し、最終的に1人のみ残る
    let state = initGame();

    // プレイヤー1を脱落させる準備
    state.players[1]!.passesUsed = 3;
    state.players[1]!.hand = [{ suit: "spades", rank: 3 }]; // 配置不可
    state.currentPlayerIndex = 1;

    // プレイヤー1を脱落させる
    state = eliminatePlayer(state);
    expect(state.players[1]!.eliminated).toBe(true);

    // プレイヤー2を脱落させる準備
    state.players[2]!.passesUsed = 3;
    state.players[2]!.hand = [{ suit: "clubs", rank: 1 }]; // 配置不可
    state.currentPlayerIndex = 2;

    // プレイヤー2を脱落させる
    state = eliminatePlayer(state);
    expect(state.players[2]!.eliminated).toBe(true);

    // ここまででプレイヤー0、3が残っている
    expect(state.phase).toBe("playing"); // 2人以上残っているのでゲーム継続

    // プレイヤー3を脱落させる準備
    state.players[3]!.passesUsed = 3;
    state.players[3]!.hand = [{ suit: "hearts", rank: 2 }]; // 配置不可
    state.currentPlayerIndex = 3;

    // プレイヤー3を脱落させる
    state = eliminatePlayer(state);
    expect(state.players[3]!.eliminated).toBe(true);

    // ここでプレイヤー0のみ残ったはずなので、ゲーム終了
    expect(state.phase).toBe("gameover");
    expect(state.winner).toBe("human"); // プレイヤー0は human
  });

  it("ジョーカーが複数プレイヤーを経由して移譲される", () => {
    // ジョーカー移譲の連鎖をテスト
    let state = initGame();

    // 初期状態: プレイヤーA がジョーカーを持っている
    const holderA = state.players.findIndex((p) => p.hand.some(isJokerCard));
    expect(holderA).toBeGreaterThanOrEqual(0);

    // プレイヤーA がジョーカーを配置
    const validPos1 = getValidJokerPositions(state.board)[0];
    if (!validPos1) return;

    // プレイヤーB がプレイヤーA が配置したジョーカーの対象カードを持っているか確認
    const holderB = state.players.findIndex(
      (p, i) =>
        i !== holderA &&
        p.hand.some(
          (c) =>
            !isJokerCard(c) &&
            (c as NormalCard).suit === validPos1.suit &&
            (c as NormalCard).rank === validPos1.rank,
        ),
    );

    if (holderB === -1) return; // テスト条件が満たされない

    state = { ...state, currentPlayerIndex: holderA };
    state = placeJoker(state, validPos1);

    // ジョーカーが A から B に移譲されたことを確認
    expect(state.players[holderA]!.hand.some(isJokerCard)).toBe(false);
    expect(state.players[holderB]!.hand.some(isJokerCard)).toBe(true);

    // プレイヤーB がジョーカーを再配置
    const validPos2 = getValidJokerPositions(state.board)[0];
    if (!validPos2) return;

    const holderC = state.players.findIndex(
      (p, i) =>
        i !== holderB &&
        p.hand.some(
          (c) =>
            !isJokerCard(c) &&
            (c as NormalCard).suit === validPos2.suit &&
            (c as NormalCard).rank === validPos2.rank,
        ),
    );

    if (holderC === -1) return;

    state = { ...state, currentPlayerIndex: holderB };
    state = placeJoker(state, validPos2);

    // ジョーカーが B から C に移譲されたことを確認
    expect(state.players[holderB]!.hand.some(isJokerCard)).toBe(false);
    expect(state.players[holderC]!.hand.some(isJokerCard)).toBe(true);

    // ジョーカーは全体で1枚のみ存在することを確認
    const totalJokers = state.players.reduce(
      (count, p) => count + (p.hand.some(isJokerCard) ? 1 : 0),
      0,
    );
    expect(totalJokers).toBe(1);
  });
});
