import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import CardSlot from "../../app/components/game/CardSlot.vue";
import HandCard from "../../app/components/game/HandCard.vue";

describe("CardSlot", () => {
  it("placed=trueの時、aria-labelに「配置済み」が含まれる", () => {
    const props = { rank: 8, suit: "spades", placed: true, isSeven: false };

    const result = render(CardSlot, { props });

    expect(result.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("配置済み"),
    );
  });

  it("placed=falseかつisSeven=falseの時、aria-labelに「未配置」が含まれる", () => {
    const props = { rank: 6, suit: "spades", placed: false, isSeven: false };

    const result = render(CardSlot, { props });

    expect(result.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("未配置"),
    );
  });
});

describe("HandCard", () => {
  it("isValid=trueかつdisabled=falseの時クリックでplayイベントが発火する", async () => {
    const props = {
      card: { suit: "hearts", rank: 8 },
      isValid: true,
      disabled: false,
    };

    const result = render(HandCard, { props });
    await fireEvent.click(result.getByRole("button"));

    expect(result.emitted().play).toBeDefined();
  });

  it("disabled=trueの時ボタンが無効化される", () => {
    const props = {
      card: { suit: "hearts", rank: 8 },
      isValid: true,
      disabled: true,
    };

    const result = render(HandCard, { props });

    expect(result.getByRole("button")).toBeDisabled();
  });
});
