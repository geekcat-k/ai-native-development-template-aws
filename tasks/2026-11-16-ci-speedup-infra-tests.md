# Task: CDKテストの合成を共有し、@claudeがverifyの完了を待つようにする

- Task ID: MAINT-2026-11-16-CI-SPEEDUP
- Status: Waiting Approval
- Owner: Claude Code
- Related Requirements: 運営者の依頼（2026-11-16、チャット）。neko-kawaii PR #117の改善をテンプレートへ反映する。
- Related Design: `docs/06-test-strategy.md`
- Created: 2026-11-16
- Updated: 2026-11-16

## 背景

- neko-kawaiiでは、CDKテストがテストごとにスタックを合成し（Lambdaのバンドルを含む）、テストが69件に増えて`verify`の約11分を占めていた。
- 同じくneko-kawaiiでは、`verify`がBashの既定のタイムアウト（2分）を超えたため、`@claude`が完了を待たずに終了し、PRを作らなかった。
- このテンプレートは現在`verify`が約30秒、infraのテストが4.4秒で問題は起きていない。テンプレートから作るプロジェクトで同じ問題が起きないよう、予防として反映する。

## 作業範囲

### 対象

- `infra/test/starter-stack.test.ts`：独自ドメインなしの標準の設定のスタックを1回だけ合成して共有する（4件）。
- `.github/workflows/claude.yml`：Bashのタイムアウトを延ばし、`pnpm verify`の完了を待つよう指示する。

### スコープ外

- 独自ドメインあり・エラー確認など、別の設定で合成するテスト。
- 本番コード（`infra/lib`など）の変更。

## 変更予定ファイル

| ファイル | 変更内容 | 備考 |
| --- | --- | --- |
| `infra/test/starter-stack.test.ts` | 標準の設定のスタックの合成を共有 | テストだけの変更 |
| `.github/workflows/claude.yml` | `settings`でBashのタイムアウトを延ばし、システムプロンプトに指示を追加 | |
| `tasks/STATUS.md` | タスクと変更履歴を追記 | |

## 完了条件

- [x] infraのテストが8件すべて成功する。
- [x] `pnpm verify`が成功する。
- [ ] このPRのCIで`verify`が成功する。

## 検証結果

- 2026-11-16: `pnpm --filter ./infra test`で8件成功。4.37秒（CI）から1.67秒（ローカル）になった。
