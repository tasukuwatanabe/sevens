# 型安全性ガイドライン

## 概要

このプロジェクトはランタイムエラーを防ぎ、コード品質を向上させるために厳格な型安全性を強制します。

## Lint ルール

- **`@typescript-eslint/no-explicit-any`** — 禁止
  - `vite.config.ts` で強制
  - `vp check` で違反をキャッチできます

## 型アサーション・型ガードのベストプラクティス

### 型アサーションの問題点

型アサーション（`as TypeName`）はTypeScriptの型チェックをバイパスし、安全ではありません：

```ts
// ❌ 安全ではない - 型チェックがされない
const card = someCard as NormalCard;
```

### 解決策：型ガードを使用

型ガードはTypeScriptが型を自動的に絞り込みます：

```ts
// ✅ 安全 - TypeScriptがチェック
if (isNormalCard(card)) {
  // このブロック内では card は NormalCard で保証される
  card.suit; // ✓ 型安全なアクセス
}
```

## 型ガードの作成

`is` キーワードを使用して型述語を作成：

```ts
export function isNormalCard(card: Card): card is NormalCard {
  return !isJokerCard(card);
}
```

チェック後、TypeScriptは自動的に型を絞り込みます：

```ts
const card: Card = getCard();

if (isNormalCard(card)) {
  // このブロック内では card は NormalCard に絞り込まれている
  console.log(card.suit); // ✓ TypeScriptはこのプロパティが存在することを知っている
}
```

## 関数オーバーロード

関数が複数の入力型を異なるように処理する場合：

```ts
// 各入力型のオーバーロードを定義
function processCard(card: JokerCard): void;
function processCard(card: NormalCard): void;

// 実装はすべてのケースを処理
function processCard(card: Card): void {
  if (isJokerCard(card)) {
    // ジョーカーを処理
  } else if (isNormalCard(card)) {
    // 通常のカードを処理
  }
}
```

## 利用可能な型ガード

`app/utils/card.ts` に配置：

- `isJokerCard(card: Card): card is JokerCard`
- `isNormalCard(card: Card): card is NormalCard`

## このプロジェクト内の例

### 例1：app/utils/joker.ts

```ts
export function getCompanionLabel(card?: Card): string {
  if (!card || !isNormalCard(card)) return "";
  // card は NormalCard に絞り込まれている
  return `${suitSymbol(card.suit)}${rankLabel(card.rank)}`;
}
```

### 例2：テスト

```ts
// ✅ 良い例：型をチェックしてからプロパティにアクセス
expect(deck.filter((c) => isNormalCard(c) && c.suit === suit)).toHaveLength(13);
```

## まとめ

| 方法                   | 安全性          | 可読性                |
| ---------------------- | --------------- | --------------------- |
| 型アサーション（`as`） | ❌ 安全ではない | ❌ 意図が不明確       |
| 型ガード（`is`）       | ✅ 安全         | ✅ 型フローが明確     |
| 関数オーバーロード     | ✅ 安全         | ✅ シグネチャが明示的 |

常に型アサーションより型ガードを優先してください。
