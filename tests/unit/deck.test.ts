import { describe, it, expect } from "vite-plus/test";
import { createDeck, shuffleDeck, dealCards, JOKER_CARD } from "@/game/deck";
import { isJokerCard } from "@/utils/card";

describe("createDeck", () => {
  it("53枚のカードを生成する（通常52枚＋ジョーカー1枚）", () => {
    expect(createDeck()).toHaveLength(53);
  });

  it("各スートに13枚ずつある", () => {
    const deck = createDeck();
    const suits = ["spades", "hearts", "diamonds", "clubs"] as const;
    for (const suit of suits) {
      expect(deck.filter((c) => !isJokerCard(c) && (c as any).suit === suit)).toHaveLength(13);
    }
  });

  it("各ランクがすべてのスートに存在する", () => {
    const deck = createDeck();
    for (let rank = 1; rank <= 13; rank++) {
      expect(deck.filter((c) => !isJokerCard(c) && (c as any).rank === rank)).toHaveLength(4);
    }
  });

  it("ジョーカーが1枚含まれる", () => {
    const deck = createDeck();
    expect(deck.filter(isJokerCard)).toHaveLength(1);
  });
});

describe("shuffleDeck", () => {
  it("元のデッキを変更しない", () => {
    const deck = createDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it("53枚のままである", () => {
    const deck = createDeck();
    expect(shuffleDeck(deck)).toHaveLength(53);
  });

  it("同じカードセットを含む（ジョーカー含む）", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(deck.length);
    expect(shuffled.filter(isJokerCard)).toHaveLength(1);
    for (const card of deck) {
      if (isJokerCard(card)) continue;
      expect(
        shuffled.some(
          (c) =>
            !isJokerCard(c) &&
            (c as any).suit === (card as any).suit &&
            (c as any).rank === (card as any).rank,
        ),
      ).toBe(true);
    }
  });
});

describe("dealCards", () => {
  it("53枚を4人に配ると1人が14枚、残り3人が13枚になる", () => {
    const deck = createDeck();
    const hands = dealCards(deck, 4);
    expect(hands).toHaveLength(4);
    expect(hands[0]).toHaveLength(14);
    expect(hands[1]).toHaveLength(13);
    expect(hands[2]).toHaveLength(13);
    expect(hands[3]).toHaveLength(13);
  });

  it("全カードが誰かの手札にある", () => {
    const deck = createDeck();
    const hands = dealCards(deck, 4);
    const allCards = hands.flat();
    expect(allCards).toHaveLength(53);
  });
});

describe("JOKER_CARD", () => {
  it("isJokerCard でジョーカーと識別できる", () => {
    expect(isJokerCard(JOKER_CARD)).toBe(true);
    expect(isJokerCard({ suit: "spades", rank: 1 })).toBe(false);
  });
});
