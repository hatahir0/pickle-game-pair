# ピックルゲームペア / Pickle Game Pair

ピックルボールのダブルスの組み合わせを自動で作るWebアプリ。参加人数・コート数・ゲーム数を指定すると、ペアができるだけ重複しないように組み合わせと休憩者を生成します。日本語・英語対応、オフライン対応（PWA）。

**公開URL**: https://hatahir0.github.io/pickle-game-pair/

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（dist/）
npm run check    # 組み合わせアルゴリズムの検証
```

`main` ブランチにプッシュすると GitHub Actions が自動でビルドして GitHub Pages に公開します。

## 技術構成

- React + Vite + TypeScript
- 状態はブラウザの localStorage に保存（サーバー不要）
- vite-plugin-pwa でオフライン対応
