import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import PlayerHand from "@/components/game/PlayerHand.vue";
import HandCard from "@/components/game/HandCard.vue";
import type { Card } from "@/types/game";

const hand: Card[] = [
  { suit: "spades", rank: 6 },
  { suit: "hearts", rank: 8 },
  { suit: "diamonds", rank: 5 },
];

const validCards: Card[] = [
  { suit: "spades", rank: 6 },
  { suit: "hearts", rank: 8 },
];

const globalConfig = {
  global: { components: { HandCard } },
};

describe("PlayerHand", () => {
  it("手札のカードをすべて表示する", () => {
    const props = { hand, validCards, disabled: false };

    const result = render(PlayerHand, { props, ...globalConfig });

    expect(result.getAllByRole("button")).toHaveLength(3);
  });

  it("有効なカードは有効、無効なカードはdisabled", () => {
    const props = { hand, validCards, disabled: false };

    const result = render(PlayerHand, { props, ...globalConfig });
    const buttons = result.getAllByRole("button");

    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).toBeDisabled();
  });

  it("有効なカードをクリックするとplayイベントが発火する", async () => {
    const props = { hand, validCards, disabled: false };

    const result = render(PlayerHand, { props, ...globalConfig });
    await fireEvent.click(result.getAllByRole("button")[0]!);

    expect(result.emitted().play).toBeDefined();
    expect(result.emitted().play).toHaveLength(1);
  });

  it("disabled=trueの時はすべてのボタンが無効化される", () => {
    const props = { hand, validCards, disabled: true };

    const result = render(PlayerHand, { props, ...globalConfig });
    const buttons = result.getAllByRole("button");

    buttons.forEach((button) => expect(button).toBeDisabled());
  });
});
