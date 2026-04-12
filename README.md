# 7並べ

ブラウザで遊べる 7並べの実装です。あなた（人間）1人と CPU 3人の計4人で対戦します。

![ゲーム画面](docs/screenshot.png)

## ゲームルール

- 52枚のトランプを4人に配る
- 各スートの 7 を起点に、6→5→… または 8→9→… と順番にカードを出していく
- 手番でカードを出せない場合はパス（最大 3回）
- 先に手札をすべて出したプレイヤーが勝利

## 機能

- CPU 3体との対戦（自動で思考・プレイ）
- PWA 対応（ホーム画面へのインストール・オフライン動作）
- ゲーム状態の localStorage 永続化
- TypeScript による型安全な実装

## 技術スタック

| カテゴリ       | 採用技術             |
| -------------- | -------------------- |
| フレームワーク | Vue 3 (Vite SPA)     |
| ルーター       | Vue Router 4         |
| 言語           | TypeScript           |
| スタイリング   | Tailwind CSS         |
| ツールチェーン | Vite+                |
| パッケージ管理 | pnpm                 |

## セットアップ

```bash
pnpm install
```

## コマンド

このプロジェクトは **Vite+** (`vp`) をツールチェーンとして使用します。

```bash
vp dev       # 開発サーバー起動 (http://localhost:3000)
vp build     # プロダクションビルド
vp check     # 型チェック・Lint・フォーマット
vp check --fix  # Lint・フォーマット問題を自動修正
vp test run  # テスト実行
```

## プロジェクト構成

```
app/
├── game/            # ゲームロジック
│   ├── constants.ts
│   ├── deck.ts
│   ├── rules.ts
│   ├── cpu.ts
│   ├── state.ts
│   └── index.ts
├── components/game/ # ゲーム UI コンポーネント
├── composables/     # Vue Composition API フック
├── pages/           # ページコンポーネント
├── types/           # TypeScript 型定義
└── utils/           # ユーティリティ関数
tests/               # テスト（Vite+）
```
