# CLAUDE.md

このファイルはこのリポジトリのコード作業を行う際のガイダンスをClaudeに提供します。

## Claude への指示

このファイルのすべての指示は日本語で提供されます。Claude Code を使用する際は、**すべての応答を日本語で行ってください**。これはプロジェクト全体での作業、コードレビュー、ドキュメント作成、PR作成などに適用されます。

## プロジェクト概要

7並べ (Sevens) — Nuxt 4 + Vue 3 + TypeScript で構築されたブラウザベースの日本のカードゲーム。1人のプレイヤーが3人のCPU対手と対戦します。PWA対応でlocalStorageによるゲーム状態の永続化機能を備えています。

## コマンド

このプロジェクトは **Vite+** (`vp`) を統合ツールチェーンとして使用しています。`pnpm`、`npm`、`yarn` を直接使用しないでください。

```bash
vp dev          # 開発サーバーを起動 (http://localhost:3000)
vp check        # フォーマット + Lint + TypeScript型チェック
vp check --fix  # Lint・フォーマット問題を自動修正
vp test run     # すべてのテストを実行
vp test run <pattern>  # 特定のテストを実行（例：vp test run rules）
vp build        # 本番ビルド
```

> `vp test`（`run` なし）はウォッチモードを開始します。CI または単発検証では常に `vp test run` を使用してください。

テストユーティリティは `vitest` ではなく `vite-plus/test` からインポートしてください：

```ts
import { expect, test, vi } from "vite-plus/test";
```

## アーキテクチャ

### ゲームロジック (`app/game/`)

Vue依存のない純粋なTypeScriptモジュール — すべての状態遷移は不変（新しいオブジェクトを返す）：

- **`types/game.ts`** — すべての型定義（`Card`、`Board`、`GameState`、`Player` など）
- **`game/constants.ts`** — `SUITS`、`MAX_PASSES`、`INITIAL_RANK`、`PLAYER_COUNT`
- **`game/deck.ts`** — デッキの生成、シャッフル、配布；`JOKER_CARD` シングルトンをエクスポート
- **`game/rules.ts`** — `isValidPlay`、`getValidCards`、`getJokerWithCardOptions`、`getValidJokerPositions`
- **`game/state.ts`** — 状態遷移関数：`initGame`、`placeCard`、`placeJoker`、`placeJokerWithCard`、`passTurn`
- **`game/cpu.ts`** — CPU AI決定ロジック
- **`utils/card.ts`** — `isJokerCard`、`areCardsEqual` ヘルパー関数

### Vue レイヤー (`app/`)

- **`composables/useGame.ts`** — メインゲームコンポーザブル；純粋なゲームロジックとVueのリアクティビティを橋渡しし、CPUターンループを駆動
- **`composables/useLocalStorage.ts`** — 永続化フック；ゲーム状態はlocalStorageから保存・復元される
- **`pages/index.vue`** — シングルゲームページ
- **`components/game/`** — 11個の集約されたコンポーネント（`GameBoard`、`PlayerHand`、`HandCard`、`CpuPlayer`、`GameStatus`、`GameOverModal`、`ActionButtons`、`CardSlot`、`BoardRow`、`ResetConfirmModal`、`JokerReceivedOverlay`）

### ゲームルール

- すべての7はゲーム開始時にボード上に事前配置されている（手札に配られない）
- `Board` はスートごとに `{ low, high }` を追跡；有効な置き方は配列を外側に拡張する
- ジョーカーはボードの任意のエッジに配置可能；置き換えられたカードを保持するプレイヤーがジョーカーを受け取る
- ジョーカーコンボ：プレイヤーが1ステップ先のカードも保持している場合、両方一緒にプレイできる
- 各プレイヤーは限定されたパス回数（`MAX_PASSES`）を持つ

### Tailwind

動的なスートカラー（`blue`/`orange`/`violet`）は実行時に生成されるため、`tailwind.config.ts` でセーフリストされています。

## コード品質

型安全性ガイドラインとベストプラクティスについては、[**`docs/type.md`**](docs/type.md) を参照してください。

## Pull Request ガイドライン

### PR説明（本文）
- **言語**: 日本語で記載してください
- **内容**: 変更の理由、テスト方法、スクリーンショット（必要な場合）を含めてください

### PRタイトル
- **言語**: 英語で記載してください
- **形式**: `feat|fix|docs|refactor: 説明的な短文`
- **例**: `feat: Add undo button`, `fix: Prevent invalid card placement`

### コミットメッセージ
- **言語**: 英語で記載してください
- **形式**: 従来のスタイル（1行目は短い説明、必要に応じて詳細を続行）
- **例**: `fix: Prevent invalid card placement with type guards`

### PR作成例

```
Commit Message: 
  fix: Prevent invalid card placement with type guards

PR Title: 
  fix: Prevent invalid card placement with type guards

PR Description (日本語): 
  ## 変更内容
  型ガードを使用して、無効なカード配置を防止する修正を行いました。

  ## テスト方法
  - `vp test run` で全テストが通過することを確認
  - ゲーム画面でルール外のカード配置ができないことを確認
```
