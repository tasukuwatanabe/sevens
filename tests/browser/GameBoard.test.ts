import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/vue";
import CpuPlayer from "@/components/game/CpuPlayer.vue";
import GameStatus from "@/components/game/GameStatus.vue";

describe("CpuPlayer コンポーネント", () => {
  it("プレイヤー名を表示する", () => {
    const props = {
      name: "CPU 1",
      handCount: 8,
      passesUsed: 1,
      isCurrentTurn: false,
      isThinking: false,
      playerIndex: 1,
    };

    const result = render(CpuPlayer, { props });

    expect(result.getByText("CPU 1")).toBeTruthy();
  });

  it("手札枚数を表示する", () => {
    const props = {
      name: "CPU 1",
      handCount: 8,
      passesUsed: 1,
      isCurrentTurn: false,
      isThinking: false,
      playerIndex: 1,
    };

    const { container } = render(CpuPlayer, { props });

    expect(within(container as HTMLElement).getByText("8枚")).toBeTruthy();
  });

  it("isCurrentTurn=trueの時aria-currentが設定される", () => {
    const props = {
      name: "CPU 2",
      handCount: 5,
      passesUsed: 0,
      isCurrentTurn: true,
      isThinking: false,
      playerIndex: 2,
    };

    const { container } = render(CpuPlayer, { props });

    expect(container.firstChild).toHaveAttribute("aria-current", "true");
  });

  it("isThinking=trueの時「考え中…」を表示する", () => {
    const props = {
      name: "CPU 3",
      handCount: 3,
      passesUsed: 0,
      isCurrentTurn: true,
      isThinking: true,
      playerIndex: 3,
    };

    const result = render(CpuPlayer, { props });

    expect(result.getByText("考え中…")).toBeTruthy();
  });
});

describe("GameStatus コンポーネント", () => {
  it("人間ターンのメッセージを表示する", () => {
    const props = { status: "human-turn", playerName: "あなた" };

    const result = render(GameStatus, { props });

    expect(result.getByText("あなたのターン")).toBeTruthy();
  });

  it("role='status'が設定されている", () => {
    const props = { status: "human-turn", playerName: "あなた" };

    const result = render(GameStatus, { props });

    expect(result.getByRole("status")).toBeTruthy();
  });

  it("cpu-thinkingの時「考え中…」メッセージを表示する", () => {
    const props = { status: "cpu-thinking", playerName: "CPU 1" };

    const result = render(GameStatus, { props });

    expect(result.getByText("CPU 1が考え中…")).toBeTruthy();
  });
});
