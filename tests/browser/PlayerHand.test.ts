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
    const result = render(PlayerHand, {
      props: { hand, validCards, disabled: false },
      ...globalConfig,
    });
    const buttons = result.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("有効なカードは有効、無効なカードはdisabled", () => {
    const result = render(PlayerHand, {
      props: { hand, validCards, disabled: false },
      ...globalConfig,
    });
    const buttons = result.getAllByRole("button") as HTMLButtonElement[];
    expect(buttons[0]!.disabled).toBe(false);
    expect(buttons[1]!.disabled).toBe(false);
    expect(buttons[2]!.disabled).toBe(true);
  });

  it("有効なカードをクリックするとplayイベントが発火する", async () => {
    const result = render(PlayerHand, {
      props: { hand, validCards, disabled: false },
      ...globalConfig,
    });
    const buttons = result.getAllByRole("button");
    await fireEvent.click(buttons[0]!);
    expect(result.emitted().play).toBeDefined();
    expect(result.emitted().play).toHaveLength(1);
  });

  it("disabled=trueの時はクリックしてもイベントが発火しない", async () => {
    const result = render(PlayerHand, {
      props: { hand, validCards, disabled: true },
      ...globalConfig,
    });
    const buttons = result.getAllByRole("button");
    await fireEvent.click(buttons[0]!);
    expect(result.emitted().play).toBeUndefined();
  });
});
