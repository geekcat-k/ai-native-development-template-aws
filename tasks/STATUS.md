# Task Status

このドキュメントは、プロジェクト全体のフェーズ進捗とタスク実行状況を管理するための一覧です。

- Last Updated: YYYY-MM-DD
- Source of Truth: 承認済みの`docs/`、承認済みの`tasks/`、この進捗一覧

## ステータス定義

| Status | 意味 |
| --- | --- |
| Not Started | 未着手 |
| In Progress | 作業中 |
| Waiting Approval | 成果物の確認・承認待ち |
| Approved | ユーザー承認済み |
| Blocked | 未決定事項または外部要因で停止中 |
| Done | 実行・検証・報告まで完了 |

## フェーズ進捗

| Phase | 名称 | 成果物 | Status | 備考 |
| --- | --- | --- | --- | --- |
| 0 | 目的・課題整理 | `docs/00-project-brief.md` | Not Started | プロジェクトの目的とスコープを整理する。 |
| 1 | 要件定義 | `docs/01-requirements.md` | Not Started | Phase 0承認後に着手する。 |
| 2 | 非機能要件 | `docs/02-non-functional-requirements.md` | Not Started | Phase 1承認後に着手する。 |
| 3 | 基本設計 | `docs/03-architecture.md` | Not Started | Phase 2承認後に着手する。 |
| 4 | 詳細設計 | `docs/04-api-design.md`, `docs/05-database-design.md` | Not Started | Phase 3承認後に着手する。 |
| 5 | テスト戦略 | `docs/06-test-strategy.md` | Not Started | Phase 4承認後に着手する。 |
| 6 | 実装計画 | `tasks/*.md` | Not Started | Phase 5承認後に個別タスクへ分解する。 |
| 7 | 実装 | 変更差分またはPull Request | Not Started | 承認済みタスク単位で実装する。 |
| 8 | レビュー | レビューコメント、修正差分 | Not Started | 実装後に実施する。 |
| 9 | リリース | `docs/07-release-operations.md` | Not Started | レビュー承認後に実施する。 |

## タスク一覧

| Task ID | タスク | 関連フェーズ | Status | 成果物 | 備考 |
| --- | --- | --- | --- | --- | --- |
|  |  |  | Not Started |  |  |

## 直近の変更履歴

| Date | 内容 | 対象 |
| --- | --- | --- |
| YYYY-MM-DD | 初期作成 | `tasks/STATUS.md` |

## 未承認・未決定事項

-

## 運用ルール

- フェーズやタスクの状態が変わったら、このドキュメントを更新する。
- 個別実装タスクは`tasks/TASK_TEMPLATE.md`をコピーして作成し、この一覧に追記する。
- `Waiting Approval`のフェーズは、ユーザー承認があるまで次フェーズへ進めない。
- `Approved`は成果物が承認された状態、`Done`は実行・検証・報告まで完了した状態として使い分ける。
- `Done`にする前に、変更内容、検証結果、残課題を報告する。
