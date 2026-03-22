import { describe, it, expect } from "vitest";
import { decideCpuAction } from "@/game/cpu";
import type { Player, Board } from "@/types/game";

function makeBoard(): Board {
  return {
    spades: { suit: "spades", low: 7, high: 7 },
    hearts: { suit: "hearts", low: 7, high: 7 },
    diamonds: { suit: "diamonds", low: 7, high: 7 },
    clubs: { suit: "clubs", low: 7, high: 7 },
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "cpu1",
    type: "cpu",
    name: "CPU 1",
    hand: [],
    passesUsed: 0,
    ...overrides,
  };
}

describe("decideCpuAction", () => {
  it("有効なカードがある場合はplaceを返す", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 6 }] });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("place");
  });

  it("placeの場合はcardが含まれる", () => {
    const player = makePlayer({ hand: [{ suit: "spades", rank: 6 }] });
    const action = decideCpuAction(player, makeBoard());
    if (action.type === "place") {
      expect(action.card).toEqual({ suit: "spades", rank: 6 });
    }
  });

  it("有効なカードがなくパスが残っている場合はpassを返す", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 0,
    });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("pass");
  });

  it("有効なカードがなくパス上限の場合もpassを返す（手詰まり防止）", () => {
    const player = makePlayer({
      hand: [{ suit: "spades", rank: 5 }],
      passesUsed: 3,
    });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("pass");
  });

  it("複数の有効なカードがある場合はいずれかを選ぶ", () => {
    const player = makePlayer({
      hand: [
        { suit: "spades", rank: 6 },
        { suit: "hearts", rank: 8 },
        { suit: "diamonds", rank: 6 },
      ],
    });
    const action = decideCpuAction(player, makeBoard());
    expect(action.type).toBe("place");
    if (action.type === "place") {
      const validRankSuit = [
        { suit: "spades", rank: 6 },
        { suit: "hearts", rank: 8 },
        { suit: "diamonds", rank: 6 },
      ];
      expect(
        validRankSuit.some((c) => c.suit === action.card.suit && c.rank === action.card.rank),
      ).toBe(true);
    }
  });
});
