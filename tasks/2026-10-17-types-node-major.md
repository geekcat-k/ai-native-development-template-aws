# Task: `@types/node` のメジャーバージョンを実行環境に揃える

- Task ID: MAINT-2026-10-17-TYPES-NODE
- Status: Waiting Approval
- Owner: Claude Code
- Related Requirements: 依存関係の保守（PR #20 のレビュー指摘）
- Created: 2026-10-17
- Updated: 2026-10-17

## 背景と目的

Dependabot の PR #20 が `@types/node` を 24 系から 26 系へ更新しようとした。CI・デプロイの Node.js（`node-version: 24`）と Lambda ランタイム（`NODEJS_24_X`）は 24 系のため、26 系の型定義では Node.js 24 にない API の使用を型チェックで検出できない。型定義を 24 系に維持し、同じ更新 PR が再作成されないようにする。

## 作業範囲

- `.github/dependabot.yml` の npm 設定で、`@types/node` のメジャー更新を無視する。24 系内のマイナー・パッチ更新は引き続き受け取る。
- `apps/api/package.json`、`infra/package.json` の `@types/node`（`^24.3.0`）とロックファイルは変更しない。
- PR #20 はマージせずにクローズする。

## 完了条件と検証

- [x] `main` の `@types/node` が 24 系、CI の Node.js と Lambda ランタイムが 24 系であることを確認した。
- [ ] Pull Request の `verify` が成功した。
- [ ] マージ後、Dependabot が `@types/node` のメジャー更新 PR を作らないことを確認する。

## リスク・未決定事項

- 実行環境を Node.js 26 系へ上げるときは、`node-version`、`NODEJS_*` ランタイム、`@types/node` を同じ Pull Request で更新し、この ignore 設定を見直す。
