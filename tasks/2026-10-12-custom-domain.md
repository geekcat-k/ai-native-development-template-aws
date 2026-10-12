# Task: Route 53 の独自ドメインで Web アプリを公開できるようにする

- Task ID: FEAT-2026-10-12-CUSTOM-DOMAIN
- Status: Waiting Approval
- Owner: Claude Code
- Related Requirements: Issue #18「独自ドメイン運用の手順追加」
- Created: 2026-10-12
- Updated: 2026-10-12

## 背景と目的

初期構成は CloudFront の既定ドメイン（`xxxx.cloudfront.net`）でだけ公開している。Issue #18 の依頼に従い、Route 53 で取得・管理するドメインで公開できるようにする。CloudFront の別名をコンソールで手作業で設定すると、次回の CDK デプロイで設定が消えるおそれがあるため、CDK に任意設定として組み込み、手順書を追加する。

## 作業範囲

- `infra/lib/starter-stack.ts`: `customDomain`（ドメイン名、ホストゾーン ID、us-east-1 の ACM 証明書 ARN）を受け取った場合だけ、CloudFront に別名と証明書を設定し、Route 53 に A/AAAA のエイリアスレコードを作る。`SiteUrl` 出力を独自ドメインにし、CloudFront の URL は `CloudFrontUrl` として出力する。
- `infra/bin/app.ts`: 環境変数 `CUSTOM_DOMAIN_NAME`、`HOSTED_ZONE_ID`、`CERTIFICATE_ARN` から設定を読む。3つとも空なら従来どおり、一部だけならエラーにする。
- `.github/workflows/ci-deploy.yml`: deploy ジョブに同名の Repository variables を渡す。
- `docs/TEMPLATE_SETUP.md`: ドメイン取得、証明書発行、変数登録、デプロイ、解除・変更、よくある失敗を追加する。
- `README.md`、`docs/07-release-operations.md`、`.env.example`: 案内を追加する。

### スコープ外

- ACM 証明書とホストゾーンの CDK 管理（証明書は us-east-1 に必要で、スタックのリージョンと分かれるため、利用者がコンソールで作成する）。
- 複数のドメイン名（`example.com` と `www.example.com` の両方など）やリダイレクト。
- API Gateway への独自ドメイン設定（API は CloudFront の `/api/*` 経由で同じドメインから使える）。

## 仮定

- ホストゾーンはアプリと同じ AWS アカウントにある。
- 公開に使う名前は1つとする。

## 完了条件と検証

- [x] CDK テストで、未設定時に別名・証明書・Route 53 レコードが作られないことを確認した。
- [x] CDK テストで、設定時に CloudFront の別名・証明書（SNI）、A/AAAA エイリアス、`SiteUrl` 出力が作られることを確認した。
- [x] us-east-1 以外の証明書、不正なドメイン名、変数の一部だけの設定がエラーになることをテストで確認した。
- [x] `pnpm verify` が成功した。
- [ ] Pull Request の `verify` が成功する。
- [ ] 利用者がドメインと証明書を用意し、変数を登録してデプロイし、独自ドメインで画面と `/api/hello` を開けることを確認する。

## リスク・未決定事項

- 同じ名前の A/AAAA レコードが既にホストゾーンにある場合や、同じ名前が別の CloudFront で使われている場合、デプロイが失敗する。手順書の「よくある失敗」に記載した。
- 独自ドメインを外す・変更するデプロイでは、CDK が作った Route 53 レコードが削除される。
- ドメイン登録料とホストゾーンの月額料金が利用者のアカウントに発生する。
