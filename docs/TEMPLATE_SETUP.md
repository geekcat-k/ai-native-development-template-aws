# ブラウザだけで行う環境構築

この手順は、テンプレートから作った**自分のリポジトリ**を対象にします。CLIのインストールは不要です。AWSとGitHubのアカウントに加え、AI開発にはClaude CodeまたはChatGPT Codexのどちらか一方のアカウントを用意してください。選んだサービスに必要な支払い設定を行います。最初は専用のAWS開発アカウントを使うことを推奨します。

## 1. GitHubリポジトリを作る

1. [GitHub](https://github.com/signup)でアカウントを作り、メール確認と2要素認証を設定します。
2. このテンプレートのGitHubページで **Use this template > Create a new repository** を選びます。
3. 所有者、リポジトリ名、公開範囲を決め、リポジトリを作ります。既存のコードは自動的にコピーされます。
4. **Settings > Actions > General** でActionsが有効か確認します。
5. **Settings > Secrets and variables > Actions > Variables** を後で開けるようにしておきます。
6. **Actions > CI and deploy > Run workflow** で`main`を選び、`deploy`をオフ（初期値）のまま一度実行します。`verify`の **Show repository IDs for AWS setup** に表示される`GitHubOwner`、`GitHubOwnerId`、`GitHubRepo`、`GitHubRepoId`を控えます。この実行では`deploy`はスキップされます。

### 推奨: `main`のRulesetを設定する

Pull RequestとCIを経由して`main`にマージするため、各自のリポジトリに[Rulesetの雛形](../.github/rulesets/protect-main.json)を取り込みます。テンプレートからリポジトリを作っただけではRulesetは有効になりません。上の手順6で`verify`が成功してから設定してください。

1. 自分のリポジトリで`.github/rulesets/protect-main.json`を開き、**Download raw file** でJSONを保存します。
2. **Settings** の左メニューで **Rulesets > Rulesets** を開き、**New ruleset > Import a ruleset** から保存したJSONを選択します。設定画面が見えない場合は、リポジトリの管理権限と[利用プラン](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)を確認します。
3. 取り込み後、対象が`main`、状態が **Active**、バイパス対象が空であることを確認します。必須ステータスチェックが **GitHub Actions** の`verify`であることも確認します。`deploy`は手動実行用なので必須チェックに加えません。
4. PR必須、未解決のレビュー会話なし、ブランチ削除・強制Push禁止を確認して **Create** を押します。
5. 最初のPRで`verify`が実行され、成功するまでマージできないことを確認します。

雛形の必須承認数は**0人**です。一人で始める場合もPRを作り、`verify`の成功と差分を自分で確認してからマージできます。チームで運用する場合は、別のレビュアーを用意して必須承認数を**1人以上**に変更してください。厳格なステータスチェック設定のため、`main`が更新された後はPRブランチを最新にして`verify`を再実行する必要があります。AIが作ったPRでも差分の確認を省かないでください。

### Dependabotの更新PR

`.github/dependabot.yml`は、GitHub Actionsとnpmパッケージに更新があるか週に一度確認する設定です。更新が見つかると、Dependabotが変更を提案するPull Request（PR）を自動で作ります。依存関係をまとめる設定はないため、複数の更新が見つかるとPRが一度に多数並ぶことがあります。

PRが作られただけでは`main`は変わらず、本番デプロイも実行されません。マージ前に各PRの差分と`verify`の結果を確認してください。メジャーバージョン更新や互いに関連するパッケージでは、個別のPRが成功しても組み合わせた状態で再検証が必要です。失敗したPRは原因を直してからマージします。GitHub ActionsはSHAで固定しているため、更新先のバージョンとSHAも確認してください。

公開リポジトリでも、クラウド認証情報はコードに含めません。`.env.example`は名前と形式の見本です。

## 2. AWSアカウントを準備する

1. [AWSアカウント作成](https://aws.amazon.com/free/)からアカウントを作り、請求情報とMFAを設定します。
2. AWS Consoleでこのアカウントにサインインし、利用するリージョンを決めます（例: `ap-northeast-1`）。
3. 画面右上のアカウントメニューで12桁のAWSアカウントIDを控えます。
4. このリポジトリの `infra/bootstrap/github-oidc-role.yaml` をGitHub画面で開き、**Download raw file** で手元に保存します。
5. [CloudFormation Console](https://console.aws.amazon.com/cloudformation/)の同じリージョンで **Create stack > With new resources** を開き、**Upload a template file** に保存したYAMLを指定します。
6. スタック名を設定し、パラメータ `GitHubOwner`、`GitHubOwnerId`、`GitHubRepo`、`GitHubRepoId` にActionsで控えた同名の値を入力します。スタック名には例として`GitHubOidcBootstrap`を使い、アプリの`STACK_NAME`とは別の名前にします。
7. 同じAWSアカウントにGitHub OIDC Providerがなければ `CreateOidcProvider=true`、既にあれば`false`にして、**Next** で「スタックオプションの設定」へ進みます。

「スタックオプションの設定」では、次のように選びます。画面に表示されない任意項目は設定不要です。

| 項目 | 設定 |
| --- | --- |
| タグ | 空欄のままで可 |
| アクセス許可（IAMサービスロール） | 既存のロールを指定せず、初期値のまま。ここで作成するGitHub用デプロイロールは選びません |
| スタック作成失敗時の動作 | 初期値の「すべてのスタックリソースをロールバック」 |
| 詳細オプション（スタックポリシー、通知、タイムアウトなど） | 初期値のまま |
| 機能（Capabilities） | 「このテンプレートでIAMリソースが作成される可能性を承認する」にチェック。表示されない場合は次の確認画面でチェック |

8. **Next** で確認画面へ進み、AWSアカウント、リージョン、GitHub所有者・リポジトリの名前とID、IAMリソース作成の承認を確認してスタックを作成します。このテンプレートは `AdministratorAccess` を持つIAMロールを作ります。
9. `CREATE_COMPLETE` になったら **Outputs** の `DeployRoleArn` を控えます。

この初期ロールは、CDK bootstrapとAWSリソース作成を簡単に始めるため、`AdministratorAccess` を持ちます。GitHub OIDCの信頼先は指定した名前・IDのリポジトリの`main`に限定しています。学習・開発用の専用AWSアカウントで利用し、実サービスでは権限を必要なサービスに絞ってください。AWSアカウントの料金予算と通知も設定してください。

## 3. GitHub Actionsの変数を設定する

自分のリポジトリの **Settings > Secrets and variables > Actions > Variables > New repository variable** で次の3つを設定します。

| 名前 | 値 |
| --- | --- |
| `AWS_ACCOUNT_ID` | 12桁のAWSアカウントID |
| `AWS_REGION` | 選んだリージョン（例: `ap-northeast-1`） |
| `AWS_DEPLOY_ROLE_ARN` | CloudFormationの `DeployRoleArn` 出力 |

任意の変数として`STACK_NAME`（既定`AiWebStarterStack`）があります。同じAWSアカウントに複数プロジェクトを置く場合だけ設定します。独自ドメインで公開する場合の変数は「8. 独自ドメインで公開する」で設定します。**手順2で作ったOIDC初期設定用スタック名（例: `GitHubOidcBootstrap`）を指定しないでください。** 迷う場合は`STACK_NAME`を登録せず、既定値を使います。

アクセスキーとシークレットアクセスキーは作成・登録しません。GitHub ActionsはOIDCの短期認証情報を使います。
Lambdaの`SAMPLE_TABLE_NAME`はCDKが設定し、画面の`apiBaseUrl`は`apps/web/public/config.json`の`/api`を使います。アプリ用の追加環境変数は初期状態では不要です。

## 4. 初回デプロイ

1. リポジトリの **Actions > CI and deploy > Run workflow** で`main`を選び、`deploy`をオンにして実行します。
2. `verify`が成功し、`deploy`が成功するまで待ちます。`deploy`の末尾 **Show site URL** に公開URLが表示されます。
3. 公開URLを開き、`Hello World` と `Hello from DynamoDB` を確認します。`https://公開URL/api/hello` を開くとJSONが見えます。

最初のCDK bootstrapはActionsが実行します。GitHubからAWSへ接続できない場合、CloudFormationパラメータの所有者名・IDとリポジトリ名・ID、GitHub変数、AWSリージョンを確認します。このテンプレートは2026年7月15日以降に作成したGitHub.comリポジトリのID入り`sub`形式 `repo:所有者@所有者ID/リポジトリ名@リポジトリID:ref:refs/heads/main` を使います。既存リポジトリなどで形式が異なる場合は、実際の`sub`に合わせてIAMロールの信頼ポリシーを変更してください。

## 5. Claude Codeを使う場合のみ接続する

1. [Claude](https://claude.ai/) のアカウントを用意します。`@claude` のGitHub Actionsの認証方法を、次のどちらか一方から選びます。
   - **Pro/Maxプランの利用枠で動かす（推奨）**: 追加のAPI契約は不要です。手元のPCにClaude Codeをインストールし、ターミナルで `claude setup-token` を実行します。ブラウザでログインすると `sk-ant-oat01-` で始まるトークンが表示されます。トークンの有効期限は約1年です。Actionsでの利用は、ブラウザやCLIでの利用と同じプランの利用上限を共有します。
   - **API従量課金で動かす**: [Claude Console](https://platform.claude.com/) でAPI利用と請求を設定し、APIキーを作ります。ClaudeのWeb利用契約だけではAPIキーが自動発行されません。
2. [Claude GitHub App](https://github.com/apps/claude) を自分のリポジトリにインストールします。必要なGitHub権限を画面で確認してください。
3. GitHubの **Settings > Secrets and variables > Actions > Secrets > New repository secret** に、手順1で選んだ方法に合わせて `CLAUDE_CODE_OAUTH_TOKEN`（Pro/Maxのトークン）または `ANTHROPIC_API_KEY`（APIキー）のどちらか一方を登録します。両方を登録するとAPIキーが優先され、従量課金になります。値をIssue、Pull Request、ファイルへ貼らないでください。
4. 自分のIssueを一つ作り、コメントに `@claude このIssueの内容を確認してください` と書いて動作を確認します。Actionsの `Claude Code` が動きます。

Pro/Maxのトークンが期限切れになったら、`claude setup-token` で再発行し、Secret `CLAUDE_CODE_OAUTH_TOKEN` の値を更新します。

`@claude`のワークフローには、ブランチ作成とPull Request作成のため`contents`/`pull-requests`/`issues`の書き込み権限を付与しています。Node.jsとpnpmを用意し、Claudeが`pnpm verify`を実行できるようにしています。AWS認証情報は渡さず、本番デプロイは利用者が`main`から手動実行します。PRが作成できない場合は、**Settings > Actions > General > Workflow permissions** の **Allow GitHub Actions to create and approve pull requests** を有効にしてください。ただしGITHUB_TOKENで作られたPRはCIが起動しないため、PR作成後に`verify`が実行されることを必ず確認してください。手順1のRulesetを設定すると、`verify`が成功するまでマージできません。

このテンプレートでは、Issue/PRコメントからの起動を管理者・メンバー・共同作業者に限定します。コメントの文面がコードを変更し得るため、Pull Requestの差分を人が確認します。

[Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)もブラウザから使えます。`claude.ai/code`の初回設定で同じGitHubリポジトリを接続すると、Web画面からクラウドセッションを開始してブランチやPull Requestを作れます。Issueコメントの`@claude`は、このWebセッションとは別にGitHub Actions上のClaude Code Actionが実行します。

## 6. ChatGPT Codexを使う場合のみ接続する

1. [ChatGPT/Codex](https://chatgpt.com/) にサインインし、Codex Cloudを使えるアカウントを用意します。利用可能なプランと上限はアカウント画面で確認します。
2. [Codex Cloud](https://learn.chatgpt.com/docs/cloud) の画面でGitHub連携を許可し、このリポジトリを選びます。
3. このリポジトリ用のクラウド環境を作ります。セットアップコマンドには `corepack enable && pnpm install --frozen-lockfile` を設定し、必要なら検証コマンド `pnpm verify` を指定します。
4. GitHub Issueのコメントに `@codex このIssueを確認してください` と書き、Codexが反応するか確認します。GitHub側のIssue連携が使えない場合はCodex Cloud画面でリポジトリを選び、IssueのURLを添えてタスクを開始します。

この構成でアプリの実行にOpenAI APIキーは必要ありません。CodexでGitHubのIssueやPull Requestを扱うための連携設定は、ClaudeのGitHub Appとは別です。

## 7. 最初の開発タスク

[IssueからAI開発を進める](DEVELOPMENT_WORKFLOW.md)に沿って、`docs/00-project-brief.md`の目的から順に記入します。Issueを作成し、`@claude`または`@codex`へ実装を依頼し、Pull RequestのCIと差分を確認してマージします。`main`のCI成功を確認したら、利用者がActionsから本番デプロイを手動実行します。

## 8. 独自ドメインで公開する（任意）

初期状態では`https://xxxx.cloudfront.net`形式のURLで公開します。`app.example.com`のような自分のドメインで公開したい場合は、手順4の初回デプロイが成功した後にこの手順を行います。ドメインの取得とDNSの管理には、アプリと**同じAWSアカウント**のRoute 53を使います。

費用として、ドメインの登録・更新料金（年額、ドメインの種類で異なる）とRoute 53ホストゾーンの月額料金が発生します。ACMの公開証明書は無料です。金額は[Route 53の料金](https://aws.amazon.com/route53/pricing/)で確認してください。

### 8-1. Route 53でドメインを取得する

1. [Route 53 Console](https://console.aws.amazon.com/route53/)の **Registered domains > Register domains** を開きます。
2. 使いたいドメイン名を検索し、空いていれば選択して購入手続きに進みます。登録期間と自動更新を選び、連絡先を入力します。連絡先の個人情報を公開しない設定（プライバシー保護）を有効にしておきます。
3. 登録者の連絡先メールアドレスに確認メールが届くので、リンクを開いて確認します。確認しないと、一定期間後にドメインが停止されます。
4. 登録完了まで数分から数時間かかります。**Registered domains** で状態が完了になるまで待ちます。
5. **Hosted zones** を開くと、取得したドメインと同じ名前のパブリックホストゾーンが自動で作られています。その **Hosted zone ID**（`Z`で始まる文字列）を控えます。

Route 53以外の事業者で取得済みのドメインを使う場合は、Route 53で同じ名前のパブリックホストゾーンを作り、表示された4つのネームサーバー（NSレコード）を取得元の事業者の管理画面に設定します。反映には最大で数十時間かかることがあります。

公開に使う名前は、取得したドメインそのもの（`example.com`）とサブドメイン（`app.example.com`など）のどちらでも構いません。この手順では1つの名前だけを設定します。

### 8-2. ACMで証明書を発行する

CloudFrontで使う証明書は、アプリのリージョンに関係なく **米国東部（バージニア北部）`us-east-1`** で発行する必要があります。

1. [ACM Console](https://console.aws.amazon.com/acm/home?region=us-east-1)を開き、画面右上のリージョンが **米国東部（バージニア北部）** になっていることを確認します。
2. **Request** で **Request a public certificate** を選びます。
3. **Fully qualified domain name** に公開に使う名前（例: `app.example.com`）を入力します。検証方法は **DNS validation** を選び、そのほかは初期値のまま **Request** を押します。
4. 作成した証明書を開き、**Create records in Route 53** から検証用のCNAMEレコードを作成します。
5. 数分待ち、状態が **Issued（発行済み）** になったら **ARN**（`arn:aws:acm:us-east-1:`で始まる文字列）を控えます。

検証用のCNAMEレコードは、証明書の自動更新に使われるため削除しないでください。

### 8-3. GitHub Actionsの変数を設定する

**Settings > Secrets and variables > Actions > Variables** で次の3つを登録します。3つすべてを設定したときだけ独自ドメインが有効になり、一部だけ設定するとデプロイがエラーで止まります。

| 名前 | 値 |
| --- | --- |
| `CUSTOM_DOMAIN_NAME` | 公開に使う名前（例: `app.example.com`）。小文字で入力し、`https://`や末尾の`/`は付けません。証明書に入力した名前と同じにします |
| `HOSTED_ZONE_ID` | 8-1で控えたHosted zone ID |
| `CERTIFICATE_ARN` | 8-2で控えた`us-east-1`の証明書ARN |
### 8-4. デプロイして確認する

1. **Actions > CI and deploy > Run workflow** で`main`を選び、`deploy`をオンにして実行します。
2. CDKがCloudFrontに独自ドメインと証明書を設定し、Route 53にCloudFrontを指すAレコードとAAAAレコード（エイリアス）を作ります。CloudFrontの設定反映に数分かかることがあります。
3. `deploy`の末尾 **Show site URL** に`https://独自ドメイン`が表示されます。そのURLを開き、`Hello World`、`Hello from DynamoDB`、`/api/hello`を確認します。

DNSの反映に数分かかることがあります。`https://xxxx.cloudfront.net`形式のURLも引き続き使えます。CloudFormationの出力`CloudFrontUrl`で確認できます。

### 独自ドメインをやめる・変更する

- やめる場合は、3つの変数を削除してデプロイします。CloudFrontの独自ドメイン設定とRoute 53のA/AAAAレコードが削除されます。ドメインとホストゾーンは残り、料金も発生し続けます。不要なら、ドメインの自動更新の停止とホストゾーンの削除を利用者がコンソールで行います。
- 名前を変える場合は、新しい名前で8-2の証明書を発行し、`CUSTOM_DOMAIN_NAME`と`CERTIFICATE_ARN`を更新してデプロイします。古い証明書は、デプロイ成功後に不要であれば削除できます。

## よくある失敗

| 状態 | 確認すること |
| --- | --- |
| `deploy` がスキップ | 手動実行で`deploy`がオフ、`main`以外のブランチを選択、または`AWS_DEPLOY_ROLE_ARN`が未設定 |
| `ERR_PNPM_INVALID_DEPLOY_TARGET` | ルート`package.json`の`cdk:deploy`が`pnpm --filter @starter/infra run deploy`になっているか確認する |
| `STACK_NAMEがGitHub OIDC初期設定用スタックを指しています` | Repository variableの`STACK_NAME`を削除するか、初期設定用スタックと異なるアプリ用の名前に変更する |
| `AssumeRoleWithWebIdentity` 失敗 | GitHub所有者・リポジトリの名前とID、信頼ポリシーの`sub`、`main`ブランチ |
| CloudFrontが403 | S3同期が完了したか、CloudFrontのキャッシュ更新が終わったか |
| APIが500 | LambdaログとDynamoDBテーブルの状態 |
| `@claude` に反応しない | GitHub App、`CLAUDE_CODE_OAUTH_TOKEN`または`ANTHROPIC_API_KEY`の登録と有効期限、Actions、コメント投稿者の権限 |
| `@claude` が利用上限で止まる | Pro/Maxのトークンを使う場合、ブラウザやCLIと共有の利用上限に達していないか |
| `@codex` に反応しない | CodexのGitHub連携、クラウド環境、対象リポジトリへの権限 |
| `独自ドメインを使う場合は … をすべて設定してください` | `CUSTOM_DOMAIN_NAME`、`HOSTED_ZONE_ID`、`CERTIFICATE_ARN`の3つが揃っているか。使わない場合は3つとも削除する |
| `us-east-1（バージニア北部）で発行したACM証明書` | 証明書をアプリと同じリージョンで発行していないか。`us-east-1`で発行し直す |
| CloudFrontの更新で証明書・別名のエラー | 証明書が **Issued** か、証明書の名前と`CUSTOM_DOMAIN_NAME`が一致しているか、同じ名前が別のCloudFrontで使われていないか |
| Route 53のレコード作成で`already exists` | ホストゾーンに同じ名前のA/AAAAレコードが既にないか。不要なら利用者が削除するか、別の名前を使う |
| 独自ドメインで開けない | DNSの反映待ちか、ホストゾーンのNSがドメインのネームサーバー設定と一致しているか |

## 公式資料

- [GitHubテンプレートリポジトリ](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [GitHub Actionsの手動実行](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [GitHub Rulesetのインポート](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository#importing-a-ruleset)
- [GitHub Rulesetで使えるルール](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub OIDCの`sub`形式](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub ActionsからAWSへのOIDC接続](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [AWS IAMのGitHub OIDCロール](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)
- [CloudFormationでのスタック作成とスタックオプション](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-create-stack.html)
- [Route 53でのドメイン登録](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/domain-register.html)
- [CloudFrontでの独自ドメインとHTTPS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
- [ACMのDNS検証](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Codex Cloud](https://learn.chatgpt.com/docs/cloud)
- [OpenAI Docs: Codex GitHub連携](https://learn.chatgpt.com/docs/third-party/github)
