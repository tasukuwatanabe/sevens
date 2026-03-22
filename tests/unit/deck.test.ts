import { describe, it, expect } from "vitest";
import { createDeck, shuffleDeck, dealCards } from "@/game/deck";

describe("createDeck", () => {
  it("52枚のカードを生成する", () => {
    expect(createDeck()).toHaveLength(52);
  });

  it("各スートに13枚ずつある", () => {
    const deck = createDeck();
    const suits = ["spades", "hearts", "diamonds", "clubs"] as const;
    for (const suit of suits) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
  });

  it("各ランクがすべてのスートに存在する", () => {
    const deck = createDeck();
    for (let rank = 1; rank <= 13; rank++) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(4);
    }
  });
});

describe("shuffleDeck", () => {
  it("元のデッキを変更しない", () => {
    const deck = createDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it("52枚のままである", () => {
    const deck = createDeck();
    expect(shuffleDeck(deck)).toHaveLength(52);
  });

  it("同じカードセットを含む", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(deck.length);
    for (const card of deck) {
      expect(shuffled.some((c) => c.suit === card.suit && c.rank === card.rank)).toBe(true);
    }
  });
});

describe("dealCards", () => {
  it("4人に13枚ずつ配る", () => {
    const deck = createDeck();
    const hands = dealCards(deck, 4);
    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(13);
    }
  });

  it("全カードが誰かの手札にある", () => {
    const deck = createDeck();
    const hands = dealCards(deck, 4);
    const allCards = hands.flat();
    expect(allCards).toHaveLength(52);
  });
});
