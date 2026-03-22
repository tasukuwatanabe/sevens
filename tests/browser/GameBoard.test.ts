import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/vue";
import CpuPlayer from "../../app/components/game/CpuPlayer.vue";
import GameStatus from "../../app/components/game/GameStatus.vue";

describe("CpuPlayer コンポーネント", () => {
  it("プレイヤー名を表示する", () => {
    const result = render(CpuPlayer, {
      props: {
        name: "CPU 1",
        handCount: 8,
        passesUsed: 1,
        isCurrentTurn: false,
        isThinking: false,
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
      },
    });
    expect(within(container as HTMLElement).getByText("8枚")).toBeTruthy();
  });

  it("isCurrentTurn=trueの時ハイライトクラスが付く", () => {
    const { container } = render(CpuPlayer, {
      props: { name: "CPU 2", handCount: 5, passesUsed: 0, isCurrentTurn: true, isThinking: false },
    });
    expect(container.firstChild).toHaveClass("border-blue-400");
  });

  it("isThinking=trueの時「考え中…」を表示する", () => {
    const result = render(CpuPlayer, {
      props: { name: "CPU 3", handCount: 3, passesUsed: 0, isCurrentTurn: true, isThinking: true },
    });
    expect(result.getByText("考え中…")).toBeTruthy();
  });
});

describe("GameStatus コンポーネント", () => {
  it("メッセージを表示する", () => {
    const result = render(GameStatus, {
      props: { message: "あなたのターンです", isHumanTurn: true },
    });
    expect(result.getByText("あなたのターンです")).toBeTruthy();
  });

  it("isHumanTurn=trueの時緑背景クラスが付く", () => {
    const { container } = render(GameStatus, {
      props: { message: "あなたのターン", isHumanTurn: true },
    });
    expect(container.firstChild).toHaveClass("bg-green-100");
  });

  it("isHumanTurn=falseの時グレー背景クラスが付く", () => {
    const { container } = render(GameStatus, {
      props: { message: "CPUのターン", isHumanTurn: false },
    });
    expect(container.firstChild).toHaveClass("bg-gray-100");
  });
});
