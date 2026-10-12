# Task: GitHub Actions の Node.js 20 警告を解消する

- Task ID: MAINT-2026-10-12
- Status: In Progress
- Owner: Codex
- Related Requirements: CI の保守
- Created: 2026-10-12
- Updated: 2026-10-12

## 背景と目的

GitHub Actions で Node.js 20 の非推奨警告が表示される。Action 自体を Node.js 24 対応版に更新し、CI とデプロイの構成を維持する。

## 作業範囲

- `.github/workflows/ci-deploy.yml` と `.github/workflows/claude.yml` の Action 参照を更新する。
- SHA 固定を維持し、公式タグと `action.yml` の `node24` 指定を確認する。
- アプリケーション、AWS リソース、デプロイ手順は変更しない。

## 完了条件と検証

- [x] 更新先のタグと SHA、Node.js 24 対応を確認した。
- [x] ワークフローの YAML 構文を確認した。
- [x] `pnpm verify` が成功した。
- [ ] Pull Request の `verify` が成功し、対象の警告が出ないことを確認する。

## リスク・未決定事項

- AWS 認証 Action の更新は本番デプロイ時にだけ実行される。AWS への手動実行は行わず、Pull Request と CI の確認後に利用者が手動デプロイで確認する。
