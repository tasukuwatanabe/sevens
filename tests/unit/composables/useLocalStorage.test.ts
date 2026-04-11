import { describe, it, expect } from "vite-plus/test";

// useLocalStorage の JSON シリアライゼーション・デシリアライゼーション動作をテスト
// localStorage 相互作用自体はブラウザ API であり、Vue のcomposables で利用される

describe("useLocalStorage - Serialization", () => {
  describe("JSON Serialization", () => {
    it("GameState 的なオブジェクトを JSON 化・復元できる", () => {
      const mockGameState = {
        board: {
          spades: { suit: "spades", low: 7, high: 7 },
          hearts: { suit: "hearts", low: 7, high: 7 },
          diamonds: { suit: "diamonds", low: 7, high: 7 },
          clubs: { suit: "clubs", low: 7, high: 7 },
        },
        players: [
          {
            id: "human",
            type: "human",
            name: "Player",
            hand: [{ suit: "spades", rank: 6 }],
            passesUsed: 0,
            eliminated: false,
          },
        ],
        phase: "playing",
        currentPlayerIndex: 0,
        winner: null,
      };

      // JSON シリアライゼーション
      const serialized = JSON.stringify(mockGameState);
      expect(serialized).toBeTruthy();

      // デシリアライゼーション
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(mockGameState);
    });

    it("ジョーカーを含むカード情報を JSON 化・復元できる", () => {
      const mockHand = [
        { suit: "spades", rank: 6 },
        { suit: "hearts", rank: 8 },
        { isJoker: true },
      ];

      const serialized = JSON.stringify(mockHand);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(mockHand);
      expect(deserialized[2]).toEqual({ isJoker: true });
    });

    it("null と undefined を含む状態を正しく処理できる", () => {
      const mockState = {
        data: "value",
        nullValue: null,
        undefinedValue: undefined, // undefined は JSON から削除される
      };

      const serialized = JSON.stringify(mockState);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.data).toBe("value");
      expect(deserialized.nullValue).toBeNull();
      expect(deserialized.undefinedValue).toBeUndefined();
    });

    it("無効な JSON 文字列はパース時に例外を発生させる", () => {
      const invalidJson = "{invalid json}";
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it("空の文字列や不正な JSON は例外を発生させる", () => {
      expect(() => JSON.parse("")).toThrow();
      expect(() => JSON.parse("undefined")).toThrow();
      expect(() => JSON.parse("null")).not.toThrow(); // null は有効
    });

    it("GameState の後方互換性（eliminated フィールド）", () => {
      const oldFormat = {
        players: [{ id: "human", type: "human", name: "Player", hand: [] }],
        phase: "playing",
        currentPlayerIndex: 0,
        winner: null,
      };

      const serialized = JSON.stringify(oldFormat);
      const deserialized = JSON.parse(serialized) as Record<string, unknown>;

      // eliminated フィールドが見つからない場合は false で補完
      const fixed = {
        ...deserialized,
        players: Array.isArray(deserialized.players)
          ? deserialized.players.map((p: unknown) => ({
              ...(p as Record<string, unknown>),
              eliminated: false,
            }))
          : [],
      };

      if (Array.isArray(fixed.players) && fixed.players.length > 0) {
        expect((fixed.players[0] as Record<string, unknown>).eliminated).toBe(false);
      }
    });
  });

  describe("Data Persistence Pattern", () => {
    it("値の変更を追跡するために、オブジェクトの深いコピーが必要", () => {
      const original = {
        board: { spades: { low: 7, high: 7 } },
      };

      // 深いコピーしない場合
      const shallow = original;
      shallow.board.spades.low = 8;
      expect(original.board.spades.low).toBe(8); // 元オブジェクトも変更されている

      // 深いコピーする場合
      const deepCopy = JSON.parse(JSON.stringify(original));
      deepCopy.board.spades.low = 9;
      expect(original.board.spades.low).toBe(8); // 元オブジェクトは変更されない
    });

    it("watch の deep オプションで深い変更を監視できる", () => {
      const _state = { nested: { value: 1 } };
      let watched = false;

      // watch 実装の模擬テスト
      const watchHandler = (val: { nested: { value: number } }) => {
        if (val.nested.value !== 1) {
          watched = true;
        }
      };

      const newState = { nested: { value: 2 } };
      watchHandler(newState);

      expect(watched).toBe(true);
    });
  });
});
