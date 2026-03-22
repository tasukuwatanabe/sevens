import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import ActionButtons from "@/components/game/ActionButtons.vue";

describe("ActionButtons", () => {
  it("canPass=trueかつisHumanTurn=trueの時パスボタンが有効", () => {
    const result = render(ActionButtons, {
      props: { canPass: true, isHumanTurn: true },
    });
    const passBtn = result.getByRole("button", { name: "パス" }) as HTMLButtonElement;
    expect(passBtn.disabled).toBe(false);
  });

  it("canPass=falseの時パスボタンがdisabled", () => {
    const result = render(ActionButtons, {
      props: { canPass: false, isHumanTurn: true },
    });
    const passBtn = result.getByRole("button", { name: "パス" }) as HTMLButtonElement;
    expect(passBtn.disabled).toBe(true);
  });

  it("isHumanTurn=falseの時パスボタンがdisabled", () => {
    const result = render(ActionButtons, {
      props: { canPass: true, isHumanTurn: false },
    });
    const passBtn = result.getByRole("button", { name: "パス" }) as HTMLButtonElement;
    expect(passBtn.disabled).toBe(true);
  });

  it("パスボタンクリックでpassイベント発火", async () => {
    const result = render(ActionButtons, {
      props: { canPass: true, isHumanTurn: true },
    });
    await fireEvent.click(result.getByRole("button", { name: "パス" }));
    expect(result.emitted().pass).toBeDefined();
  });

  it("リセットボタンクリックでresetイベント発火", async () => {
    const result = render(ActionButtons, {
      props: { canPass: false, isHumanTurn: true },
    });
    await fireEvent.click(result.getByRole("button", { name: "リセット" }));
    expect(result.emitted().reset).toBeDefined();
  });
});
