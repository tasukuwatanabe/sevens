import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/vue";
import CpuPlayer from "@/components/game/CpuPlayer.vue";
import GameStatus from "@/components/game/GameStatus.vue";

describe("CpuPlayer コンポーネント", () => {
  it("プレイヤー名を表示する", () => {
    const result = render(CpuPlayer, {
      props: {
        name: "CPU 1",
        handCount: 8,
        passesUsed: 1,
        isCurrentTurn: false,
        isThinking: false,
        playerIndex: 1,
      },
    });
    expect(result.getByText("CPU 1")).toBeTruthy();
  });

  it("手札枚数を表示する", () => {
    const { container } = render(CpuPlayer, {
      props: {
        name: "CPU 1",
        handCount: 8,
        passesUsed: 1,
        isCurrentTurn: false,
        isThinking: false,
        playerIndex: 1,
      },
    });
    expect(within(container as HTMLElement).getByText("8枚")).toBeTruthy();
  });

  it("isCurrentTurn=trueの時ハイライトクラスが付く", () => {
    const { container } = render(CpuPlayer, {
      props: {
        name: "CPU 2",
        handCount: 5,
        passesUsed: 0,
        isCurrentTurn: true,
        isThinking: false,
        playerIndex: 2,
      },
    });
    expect(container.firstChild).toHaveClass("border-blue-400");
  });

  it("isThinking=trueの時「考え中…」を表示する", () => {
    const result = render(CpuPlayer, {
      props: {
        name: "CPU 3",
        handCount: 3,
        passesUsed: 0,
        isCurrentTurn: true,
        isThinking: true,
        playerIndex: 3,
      },
    });
    expect(result.getByText("考え中…")).toBeTruthy();
  });
});

describe("GameStatus コンポーネント", () => {
  it("人間ターンのメッセージを表示する", () => {
    const result = render(GameStatus, {
      props: { status: "human-turn", playerName: "あなた" },
    });
    expect(result.getByText("あなたのターン")).toBeTruthy();
  });

  it("人間ターン時は緑背景クラスが付く", () => {
    const { container } = render(GameStatus, {
      props: { status: "human-turn", playerName: "あなた" },
    });
    expect(container.firstChild).toHaveClass("bg-green-100");
  });

  it("CPUターン時はグレー背景クラスが付く", () => {
    const { container } = render(GameStatus, {
      props: { status: "cpu-turn", playerName: "CPU 1" },
    });
    expect(container.firstChild).toHaveClass("bg-gray-100");
  });
});
