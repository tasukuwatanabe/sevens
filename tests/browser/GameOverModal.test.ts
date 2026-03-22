import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import GameOverModal from "../../app/components/game/GameOverModal.vue";

const players = [
  { id: "human" as const, name: "あなた" },
  { id: "cpu1" as const, name: "CPU 1" },
  { id: "cpu2" as const, name: "CPU 2" },
  { id: "cpu3" as const, name: "CPU 3" },
];

describe("GameOverModal", () => {
  it("人間が勝者の場合「勝利！」と表示する", () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    expect(result.getByText("勝利！")).toBeTruthy();
  });

  it("CPUが勝者の場合「ゲームオーバー」と表示する", () => {
    const result = render(GameOverModal, {
      props: { winner: "cpu1", players },
    });
    expect(result.getByText("ゲームオーバー")).toBeTruthy();
  });

  it("勝者名を「〇〇が上がりました！」と表示する（human）", () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    expect(result.getByText("あなたが上がりました！")).toBeTruthy();
  });

  it("勝者名を「〇〇が上がりました！」と表示する（CPU）", () => {
    const result = render(GameOverModal, {
      props: { winner: "cpu1", players },
    });
    expect(result.getByText("CPU 1が上がりました！")).toBeTruthy();
  });

  it("「もう一度プレイ」ボタンが表示される", () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    expect(result.getByRole("button", { name: "もう一度プレイ" })).toBeTruthy();
  });

  it("リセットボタンクリックでresetイベントが発火する", async () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    await fireEvent.click(result.getByRole("button", { name: "もう一度プレイ" }));
    expect(result.emitted().reset).toBeDefined();
  });

  it("Escapeキー押下でresetイベントが発火する", async () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    await fireEvent.keyDown(document, { key: "Escape" });
    expect(result.emitted().reset).toBeDefined();
  });

  it("role='dialog' が設定されている", () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    expect(result.getByRole("dialog")).toBeTruthy();
  });

  it("アンマウント後はEscapeキーでresetが発火しない", async () => {
    const result = render(GameOverModal, {
      props: { winner: "human", players },
    });
    result.unmount();
    await fireEvent.keyDown(document, { key: "Escape" });
    expect(result.emitted().reset).toBeUndefined();
  });
});
