# Task: GitHub Actionsの利用時間を減らす

- Task ID: MAINT-2026-10-22-CI-COST
- Status: Waiting Approval
- Owner: Claude Code
- Related Requirements: 運営者の依頼（2026-10-22、チャット）。neko-kawaii PR #52と同じ変更を反映する。
- Created: 2026-10-22
- Updated: 2026-10-22

## 背景と目的

このテンプレートから作ったリポジトリ（neko-kawaii）で、Actionsの利用時間の約8割が`verify`だった。Markdownだけの変更でもpushのたびにすべて検証し、同じPRへ続けてpushしても古い実行が最後まで動いていた。neko-kawaiiで行った対策をテンプレートにも入れ、ここから作るリポジトリで同じ無駄が出ないようにする。

このリポジトリはpublicのため、標準ランナーのActionsは無料で、このリポジトリ自体の請求は変わらない。

## 作業範囲

- `.github/workflows/ci-deploy.yml`の`verify`ジョブ。
  1. 変更が`docs/`直下・`docs/decisions/`・`tasks/`・リポジトリ直下のMarkdownだけなら、`pnpm verify`を省略して成功にする。
  2. `pull_request`のときだけ、同じPRの古い`verify`を止める。
- `docs/DEVELOPMENT_WORKFLOW.md`に動作を追記する。

スコープ外: `claude.yml`、`deploy`ジョブ、`pnpm verify`自体の高速化。

## 実装方針

- PRではマージ結果の1つ目の親との差分、pushでは`github.event.before`との差分を見る。差分を取得できない場合や変更ファイルがない場合は、すべて検証する。
- 手動実行（`workflow_dispatch`、本番デプロイ）では、変更内容にかかわらずすべて検証する。
- `concurrency`は`verify`ジョブだけに付け、PR以外は実行ごとに別のグループにする。`main`へのpushとデプロイは止めない。
- 現在、テスト・ビルドが読むMarkdownはない。読むようにした場合は判定から外す（`docs/DEVELOPMENT_WORKFLOW.md`に記載）。

## 完了条件

- [x] Markdownだけの変更のPR・pushで`pnpm verify`が省略され、`verify`が成功になる。
- [x] それ以外の変更、差分を取得できない場合、手動実行ではすべて検証する。
- [ ] このPRで、ワークフローの変更を含むため`pnpm verify`がすべて実行され、成功する。

## 検証結果

- 2026-10-22: 判定スクリプトはneko-kawaii（PR #52）と同一。neko-kawaiiの実コミットで、Markdownだけの変更なら省略、コード・ワークフローを含む変更や存在しない`before`ではすべて検証することを確認した。このリポジトリのコミットでも同じ判定を確認した。
