# パッケージ監査レポート

## 調査概要

Vite Plus (vp) を使用しているプロジェクトのパッケージ依存関係を監査しました。

---

## 依存パッケージ分析

### ✅ **確実に必要なパッケージ**

| パッケージ                     | 用途                        | 根拠                                                      |
| ------------------------------ | --------------------------- | --------------------------------------------------------- |
| `vue`                          | フレームワーク              | app ディレクトリで広く使用                                |
| `vue-router`                   | ルーティング                | app/pages/\*.vue で使用                                   |
| `@vitejs/plugin-vue`           | Vite + Vue 統合             | vite.config.ts で明示的に import                          |
| `vite-plus`                    | 統合開発ツール              | vite.config.ts で defineConfig に使用                     |
| `@voidzero-dev/vite-plus-core` | Vite Plus 依存              | vite-plus の内部依存                                      |
| `tailwindcss`                  | CSS フレームワーク          | tailwind.config.js で設定                                 |
| `@tailwindcss/postcss`         | Tailwind PostCSS プラグイン | postcss.config.js で plugins に指定                       |
| `postcss`                      | CSS 変換                    | vite.config.ts の css.postcss で参照                      |
| `vite-plugin-pwa`              | PWA サポート                | tsconfig.json の types で "vite-plugin-pwa/client" を参照 |
| `@cloudflare/workers-types`    | Workers型定義               | workers/tsconfig.json で types に指定                     |
| `@types/node`                  | Node.js 型定義              | vite-plus, vite, vite-plugin-pwa の依存                   |
| `wrangler`                     | Cloudflare Workers CLI      | wrangler.toml が存在、workers フォルダで使用              |

---

## ⚠️ **不要なパッケージの候補**

### 1. **`autoprefixer` (10.4.27)** - 🔴 **削除推奨**

**現状:** postcss.config.js に明示的に設定されている

**問題:**

- Tailwind CSS v4 は Lightning CSS を内部で使用しており、ベンダープレフィックスを自動的に処理
- autoprefixer は Tailwind CSS 4 では不要

**削除による影響:** なし（Tailwind CSS 4 が自動的に対応）

**参考:**

- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [GitHub Discussion: V4 postcss plugins not loaded](https://github.com/tailwindlabs/tailwindcss/discussions/15518)

---

### 2. **`vue-tsc` (3.2.6)** - 🟡 **要確認**

**現状:** package.json の devDependencies に直接指定

**問題:**

- `vp check` が TypeScript チェックを実行する際、vue-tsc 機能が既に統合されている可能性
- Vite Plus は vite-plugin-checker を内部的に使用している可能性

**確認方法:**

```bash
pnpm vp check --help
# またはドキュメントで vp check の動作を確認
```

**状態:**

- vp check に vue-tsc が統合されていれば、削除可能
- 統合されていなければ、キープ必要

---

## 📊 **検出結果サマリー**

| カテゴリ        | パッケージ数 | 削除可能 | 要確認 |
| --------------- | ------------ | -------- | ------ |
| 依存パッケージ  | 2            | 0        | 0      |
| devDependencies | 12           | 1        | 1      |
| **合計**        | **14**       | **1**    | **1**  |

---

## 🎯 **推奨アクション**

### **即座に実施可能:**

1. **`autoprefixer` を削除**

   ```json
   // package.json から削除
   - "autoprefixer": "10.4.27"
   ```

   ```javascript
   // postcss.config.js から削除
   export default {
     plugins: {
       "@tailwindcss/postcss": {},
       // - autoprefixer: {}, ← この行を削除
     },
   };
   ```

### **要確認後に実施:**

2. **`vue-tsc` の必要性を確認**
   - `vp check` コマンドのドキュメントを確認
   - `pnpm vp check --help` を実行
   - 実際に `vp check` で型チェックが実行されるか確認
   - 不要なら削除

---

## 📝 **注記**

- **`@types/node`** は Vite Plus とその依存から必要なため削除不可
- **`wrangler`** は wrangler.toml で build command が定義されているため、削除不可
- **`postcss` と `@tailwindcss/postcss`** は Tailwind CSS v4 で必須

---

**調査日:** 2026-04-12  
**Vite Plus バージョン:** 0.1.15  
**Tailwind CSS バージョン:** 4.2.2
