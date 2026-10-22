# GitHub IssueからAI開発を進める

## 最初の設定

[環境構築手順](TEMPLATE_SETUP.md)で、GitHubリポジトリとAWSを設定し、Claude CodeまたはChatGPT Codexのどちらか一方を接続します。リポジトリの`AGENTS.md`はCodexに、`CLAUDE.md`はClaudeに指示を渡します。

## 1. 仕様とIssueを作る

`docs/00-project-brief.md`から対象工程のdocsを埋め、決まった内容を`tasks/TASK_TEMPLATE.md`からタスクにします。GitHubの **Issues > New issue** で開発タスクを作成し、対象docs、変更する場所、完了条件、テスト方針を書きます。

## 2. AIに作業を依頼する

どちらか一方を使います。

- **Claude**: Issueコメントに `@claude このIssueのタスクを実装し、検証結果をPull Requestに記載してください` と投稿します。`.github/workflows/claude.yml` がClaude Code Actionを起動します。初回はClaude GitHub Appと、`CLAUDE_CODE_OAUTH_TOKEN`（Pro/Maxプランの利用枠）または`ANTHROPIC_API_KEY`（API従量課金）のどちらか一方の設定が必要です。Claude Code on the webから同じIssueを参照してクラウドセッションを始めることもできます。
- **Codex**: CodexのGitHub連携とクラウド環境を設定し、Issueコメントで `@codex このIssueを実装し、テストしてPull Requestを作成してください` と依頼します。CodexのIssueコメント連携にはリポジトリへのアクセス設定が必要です。反応しない場合はCodex Cloud画面で同じIssueを参照してタスクを開始します。

AIの作業結果とテスト結果を確認します。AIが作ったPull Requestは人がレビューします。

## 3. Pull RequestとCI

Pull Requestで `CI and deploy / verify` が型チェック、テスト、ビルド、CDK synthを実行します。失敗したら該当Pull Requestで`@claude`または`@codex`に修正を依頼します。Codexのレビューを利用する場合はPull Requestコメントの `@codex review` を使います。

Actionsの利用時間を減らすため、`verify`は次のように動きます。

- 変更が`docs/`直下・`docs/decisions/`・`tasks/`・リポジトリ直下のMarkdownだけなら、`pnpm verify`を省略して成功にします。本番デプロイの手動実行では常にすべて検証します。テストやビルドがこれらのMarkdownを読むようにした場合は、`.github/workflows/ci-deploy.yml`の判定から外してください。
- 同じPull Requestへ続けてpushした場合は、古い`verify`を止めて最新のコミットだけを検証します。

## 4. マージとAWSデプロイ

承認後にPull Requestを`main`へマージすると、GitHub ActionsはCIを実行します。利用者がCI成功とリリース内容を確認し、**Actions > CI and deploy > Run workflow** で`main`を選び、`deploy`をオンにして実行します。初回は先にGitHub Repository variablesを設定してください。手動実行の`verify`が成功すると、`deploy`がOIDCでAWSへ接続し、CDKをデプロイし、静的ファイルをS3へ配信して、CloudFrontのキャッシュを更新します。

Actionsログの末尾にCloudFront URLが出ます。公開画面と `/api/hello` の応答をブラウザで確認します。

## 安全に進めるための境界

Pull RequestではAWS認証情報を渡さず、本番デプロイは利用者による`main`の手動実行だけで行います。ClaudeへのIssueコメントはリポジトリ管理者・メンバー・共同作業者に限定しています。GitHubに秘密情報を書かず、AWSデプロイロールとClaudeの認証トークンまたはAPIキーは指定された設定欄だけに置きます。データ削除、認証設定、本番データの変更は個別Issueで判断します。

## 公式資料

- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Codex Cloud](https://learn.chatgpt.com/docs/cloud)
- [Codex GitHub連携](https://learn.chatgpt.com/docs/third-party/github)
- [GitHub OIDCとAWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
