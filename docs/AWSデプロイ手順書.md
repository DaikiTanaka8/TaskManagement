# AWSデプロイ手順書

TaskManagement を AWS の EC2 1台にデプロイする手順。Terraform で環境を作り、スクリプトでアプリを配置する。
用語の解説は [AWSデプロイ解説.md](AWSデプロイ解説.md) を参照。

## 1. 構成

```
Mac のブラウザ ──(SSMトンネル / 直接80番)──> Nginx(80) ─┬─ /     → React の静的ファイル
                                                         └─ /api/ → Spring Boot (127.0.0.1:8080) → PostgreSQL (127.0.0.1:5432)
                                                  （すべて EC2 1台の中）
```

| 項目 | 内容 |
|---|---|
| リージョン | ap-northeast-1（東京） |
| EC2 | t3.micro / Amazon Linux 2023 / ディスク 8GB / デフォルトVPC |
| DB | EC2内の PostgreSQL 17（RDS は使わない。コスト削減のため） |
| 転送用 S3 | jar と画面のファイルを EC2 に渡すためのバケット（`destroy` で中身ごと削除） |
| 接続方法 | SSH は使わず SSM Session Manager（22番ポートは開けない） |
| セキュリティグループ | **自分のIPからの80番のみ**許可（8080 / 5432 / 22 は開けない） |

### Terraform が作るもの（10個）
- `infra/main.tf`: EC2、セキュリティグループ（入出力ルール）、SSM用IAMロール・プロファイル
- `infra/s3.tf`: 転送用S3バケット（公開ブロック付き）と、EC2ロールへの読み取り権限

### 主なファイル
| ファイル | 役割 | 実行場所 |
|---|---|---|
| `infra/scripts/setup-postgresql.sh` | PostgreSQL 17 のインストール、DB・ユーザー作成 | EC2 |
| `infra/scripts/setup-backend.sh` | Java 25・スワップ・systemdサービスの設定 | EC2 |
| `infra/scripts/deploy-backend.sh` | jar をビルド → S3 → EC2 に配置して再起動 | Mac |
| `infra/scripts/setup-frontend.sh` | Nginx のインストールと設定 | EC2 |
| `infra/scripts/deploy-frontend.sh` | 画面をビルド → S3 → EC2 に配置 | Mac |
| `infra/nginx/taskmanagement.conf` | Nginx 設定（`/api/` を Spring Boot に転送） | EC2に配置 |

## 2. 事前準備（初回のみ）

1. AWS アカウント・IAM ユーザーの作成、`aws configure` での認証設定（[AWSデプロイ解説.md](AWSデプロイ解説.md) の手順）
2. ツールのインストール: AWS CLI、Terraform、Java、Maven、Node.js
3. **session-manager-plugin**（SSMトンネルに必要）
   - `brew install --cask session-manager-plugin`（Macのパスワードが必要）
   - または AWS 公式の zip（`sessionmanager-bundle.zip`）を展開し、`bin/session-manager-plugin` を `~/.local/bin/` に置く
4. 認証の確認: `aws sts get-caller-identity` でIAMユーザーが表示されること

## 3. 構築手順

> コマンドはすべてリポジトリのルートで実行する。作成すると **EC2 の課金が始まる**（目安: 1時間あたり3円前後）。

### 手順1: 自分のIPを設定
```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars の my_ip_cidr を自分のIPに書き換える（例: "203.0.113.5/32"）
curl checkip.amazonaws.com   # 自分のIPの調べ方
```
`terraform.tfvars` は `.gitignore` で除外されている（コミットしない）。

### 手順2: AWS リソースの作成
```bash
cd infra
terraform init
terraform plan     # 何が作られるか確認（課金なし）
terraform apply    # 実際に作成（課金開始）
```
`terraform apply` の出力に、`instance_id` と `deploy_bucket` が表示される。

### 手順3: DB パスワードの生成
```bash
cd infra
(umask 077; openssl rand -hex 16 > db-password.txt)
```
`db-password.txt` は `.gitignore` で除外されている。**チャットやコードに貼らない。**

### 手順4: PostgreSQL のセットアップ（EC2上で実行）
`setup-postgresql.sh` を SSM 経由で EC2 に送って実行する。
```bash
cd infra
ID=$(terraform output -raw instance_id)
PW=$(cat db-password.txt)
B64=$(gzip -c scripts/setup-postgresql.sh | base64 | tr -d '\n')
aws ssm send-command --region ap-northeast-1 --instance-ids "$ID" \
  --document-name AWS-RunShellScript --timeout-seconds 600 \
  --parameters "commands=[\"echo $B64 | base64 -d | gunzip > /tmp/setup-postgresql.sh\",\"DB_PASSWORD=$PW bash /tmp/setup-postgresql.sh\",\"rm -f /tmp/setup-postgresql.sh\"]"
```
- 作成されるもの: DB `taskmanagement`、ユーザー `taskuser`（`application.properties` に合わせている）
- PostgreSQL は `127.0.0.1` のみで待ち受ける（外部公開しない）

### 手順5: バックエンドのデプロイ
```bash
bash infra/scripts/deploy-backend.sh --setup   # 初回: EC2の環境構築 + デプロイ
bash infra/scripts/deploy-backend.sh           # 2回目以降: ビルド + デプロイのみ
```
- `--setup` で Java 25、スワップ1GB、サービス用ユーザー、systemd サービスを用意する
- DB パスワードは EC2 の `/etc/taskmanagement.env`（権限600）に環境変数として置かれ、`application.properties` の開発用パスワードを上書きする

### 手順6: フロントエンドのデプロイ
```bash
bash infra/scripts/deploy-frontend.sh --setup   # 初回: Nginxの構築 + デプロイ
bash infra/scripts/deploy-frontend.sh           # 2回目以降: ビルド + デプロイのみ
```

## 4. 動作確認

### 4-1. EC2 の中から確認（SSM）
```bash
ID=$(terraform -chdir=infra output -raw instance_id)
aws ssm send-command --region ap-northeast-1 --instance-ids "$ID" --document-name AWS-RunShellScript \
  --parameters 'commands=["systemctl is-active nginx taskmanagement postgresql","curl -4 -s -o /dev/null -w \"%{http_code}\\n\" http://127.0.0.1/","curl -4 -s -w \"\\n%{http_code}\\n\" http://127.0.0.1/api/tasks"]'
```
3つのサービスが `active`、画面と API がどちらも `200` なら正常。

### 4-2. ブラウザで確認
- 直接: `http://<EC2の公開IP>/`（公開IPは `terraform output public_ip`）
- **直接つながらない場合は SSM トンネルを使う**（5章 参照）
  ```bash
  aws ssm start-session --region ap-northeast-1 \
    --target "$(terraform -chdir=infra output -raw instance_id)" \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["80"],"localPortNumber":["8081"]}'
  ```
  トンネルを開いたまま、ブラウザで `http://localhost:8081/` を開く。約20分使わないと自動終了する。
- 確認項目: タスクの追加・期限の更新・並び替え・完了への移動・再読み込み後にデータが残ること

## 5. トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| ブラウザが読み込み中のまま（直接アクセス） | 使用中のネットワークが80番の通信を途中で横取りしている。Nginx のアクセスログに自分のIPの記録がない。存在しないIP（例 `192.0.2.1`）の80番にも `nc -vz` が成功する | SSM トンネル（`localhost:8081`）を使う。別のネットワーク（テザリング等）なら直接開ける場合がある（その場合はSGのIPも更新） |
| 並び替え・期限更新で失敗（403 `Invalid CORS request`） | Nginx が `Host` をポート抜き（`$host`）で渡すと、ブラウザの `Origin`（`localhost:8081`）と食い違い、Spring が CORS と誤判定する | `taskmanagement.conf` の `proxy_set_header Host` を `$http_host` にする（対応済み） |
| `/api/...` が Nginx の 404 になる | Nginx 標準設定と `server_name _` が衝突し、こちらの設定が無視される | `server_name` を `taskmanagement` にする（対応済み） |
| `npm ci` が ERESOLVE で失敗 | `eslint-plugin-react` が ESLint 10 の peer に未対応 | `package.json` の `overrides` で解消済み（#50）。古いブランチでは `npm ci --legacy-peer-deps` |
| 自分のIPが変わってつながらない | SGは登録したIPのみ許可 | `terraform.tfvars` の IP を更新して `terraform apply` |
| EC2 を再起動したらIPが変わった | 固定IP（Elastic IP）を使っていない | `terraform output public_ip` で再確認 |
| `terraform apply` が権限エラー | IAM ユーザーの権限不足 | コンソールで必要なポリシーを付与 |

## 6. 終了時（消し忘れ防止）

**学習を終えるときは必ず削除する。** 起動したままだと課金が続く。
```bash
cd infra
terraform destroy         # EC2・S3・IAM・SG をすべて削除
terraform state list      # 何も表示されなければ削除済み
```
- S3 は `force_destroy = true` のため、中にファイルがあっても削除される
- **EC2 内のデータ（登録したタスク）も消える**
- 再開するときは、手順2〜6をやり直す（スクリプトで同じ環境を再現できる）
- `terraform destroy` の前に、SSMトンネルを開いている場合は閉じる（Ctrl+C）

## 7. コストの目安（東京、概算）

| 項目 | 目安 |
|---|---|
| EC2 t3.micro | 約2円/時間（起動中のみ） |
| 公開IPv4アドレス | 約0.8円/時間（EC2起動中のみ） |
| EBS 8GB | 月約150円（EC2を停止しても課金される。`destroy`で停止） |
| 転送用S3 | 月1円未満 |
| RDS / ALB / NAT / CloudFront | 作らない（常時課金のため） |

正確な料金は AWS の料金ページ、請求ダッシュボードで確認する。**課金アラート（Budgets）の設定を推奨。**

## 8. 注意事項

- HTTP のみ・認証なし。アクセスは自分のIP（とSSMトンネル）に限定している。パスワードや個人情報は入力しない
- アプリのソースコード（`CorsConfig.java` / `taskApi.js` / `application.properties`）は変更していない
- 講義との差分: SSH ではなく SSM を使用、RDS ではなく EC2 内の PostgreSQL を使用、デフォルトVPCを使用
