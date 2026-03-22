import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import CardSlot from "../../app/components/game/CardSlot.vue";
import HandCard from "../../app/components/game/HandCard.vue";

describe("CardSlot", () => {
  it("モバイル・デスクトップのサイズクラスを持つ", () => {
    const { container } = render(CardSlot, {
      props: { rank: 7, suit: "spades", placed: true, isSeven: true },
    });
    expect(container.firstChild).toHaveClass("w-6", "h-9", "sm:w-14", "sm:h-20");
  });

  it("placed=trueの時、白背景クラスが付く", () => {
    const { container } = render(CardSlot, {
      props: { rank: 8, suit: "spades", placed: true, isSeven: false },
    });
    expect(container.firstChild).toHaveClass("bg-white");
  });

  it("placed=falseかつisSeven=falseの時、グレー背景クラスが付く", () => {
    const { container } = render(CardSlot, {
      props: { rank: 6, suit: "spades", placed: false, isSeven: false },
    });
    expect(container.firstChild).toHaveClass("bg-gray-100");
  });
});

describe("HandCard", () => {
  it("モバイル・デスクトップのサイズクラスを持つ", () => {
    const { container } = render(HandCard, {
      props: { card: { suit: "spades", rank: 7 }, isValid: true, disabled: false },
    });
    expect(container.firstChild).toHaveClass("w-10", "h-14", "sm:w-14", "sm:h-20");
  });

  it("isValid=trueかつdisabled=falseの時クリックでplayイベントが発火する", async () => {
    const result = render(HandCard, {
      props: { card: { suit: "hearts", rank: 8 }, isValid: true, disabled: false },
    });
    await fireEvent.click(result.getByRole("button"));
    expect(result.emitted().play).toBeDefined();
  });

  it("disabled=trueの時クリックしてもplayイベントが発火しない", async () => {
    const result = render(HandCard, {
      props: { card: { suit: "hearts", rank: 8 }, isValid: true, disabled: true },
    });
    await fireEvent.click(result.getByRole("button"));
    expect(result.emitted().play).toBeUndefined();
  });
});
