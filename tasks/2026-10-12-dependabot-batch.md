# Task: Dependabot の依存更新をまとめて適用する

- Task ID: MAINT-2026-10-12-DEPENDABOT
- Status: Done
- Owner: Codex
- Related Requirements: CI と開発依存の保守
- Created: 2026-10-12
- Updated: 2026-10-12

## 背景と目的

利用者の依頼により、Dependabot PR #1、#3〜#9 の更新を一つの PR に集約してマージする。#2 の AWS 認証 Action 更新は PR #14 に取り込まれ、#2 はクローズ済み。

## 作業範囲

- GitHub Actions の checkout、setup-node、pnpm/action-setup の SHA 固定版を更新する。
- esbuild、TypeScript、Vitest、Vite、@vitejs/plugin-react を Dependabot 提案版に更新する。
- #9 の CI エラーを Vite とプラグインの同時更新で解消する。
- Vitest 5 がビルド済み `dist` のテストを再実行しないようにする。
- AWS へのデプロイは実行しない。

## テスト方針と完了条件

- [x] `pnpm install --frozen-lockfile` が成功する。
- [x] `pnpm verify`（型チェック、テスト、ビルド、CDK synth）が成功する。
- [x] 集約 PR #15 の `verify` が成功し、差分を確認した（Actions run 38227495722）。
- [x] 集約 PR #15 をマージし、置き換えた Dependabot PR を整理する。

## リスク・未決定事項

- メジャーバージョン更新を含むため、組み合わせた状態で CI を確認する。
- GitHub Actions のデプロイジョブは PR では実行されない。AWS 認証 Action は PR #14 で更新済み。
