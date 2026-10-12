# Task: @claude の GitHub Actions を Pro/Max プランの利用枠で動かせるようにする

- Task ID: MAINT-2026-10-12-CLAUDE-AUTH
- Status: Waiting Approval
- Owner: Claude Code
- Related Requirements: AI開発環境の保守
- Created: 2026-10-12
- Updated: 2026-10-12

## 背景と目的

`@claude` の GitHub Actions は `ANTHROPIC_API_KEY` だけに対応しており、Claude Console での API 従量課金契約が必要だった。月額の Pro/Max プランの利用枠で動かせるように、Claude Code Action の `claude_code_oauth_token` 入力に対応する。

## 作業範囲

- `.github/workflows/claude.yml` に `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` を追加する。既存の `anthropic_api_key` は残し、どちらか一方の Secret で動くようにする。
- `docs/TEMPLATE_SETUP.md` と `docs/DEVELOPMENT_WORKFLOW.md` に、`claude setup-token` によるトークン発行と Secret 登録の手順を記載する。
- Action のバージョン、権限、許可コマンド、AWS 関連設定は変更しない。

## 完了条件と検証

- [x] 固定している `anthropics/claude-code-action`（SHA `1d6de8c`）の `action.yml` に `claude_code_oauth_token` 入力があることを確認した。
- [x] `pnpm verify` が成功した。
- [ ] Pull Request の `verify` が成功する。
- [ ] 利用者が Secret `CLAUDE_CODE_OAUTH_TOKEN` を登録し、Issue コメントの `@claude` で Actions が動くことを確認する。

## リスク・未決定事項

- Pro/Max の利用上限はブラウザや CLI と共有される。Actions で重い作業を行うと、ほかでの利用が上限に達しやすくなる。
- トークンの有効期限は約1年であり、期限切れ後は再発行と Secret 更新が必要になる。
- 両方の Secret を登録すると API キーが優先され、従量課金になる。手順書ではどちらか一方だけを登録するよう案内する。
