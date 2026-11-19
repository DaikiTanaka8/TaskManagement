# AWSデプロイ解説（AWS CLI + Terraform）

初心者向けに、AWS・AWS CLI・IaC・Terraform の基礎と、デプロイ前の準備手順をまとめたドキュメント。

## 1. 全体像

```
あなた → Claude Code（AI）→ Terraform のコードを書く
                              ↓ terraform apply
                        AWS CLI の認証情報を使って
                              ↓
                        AWS 上にサーバー等が自動で作られる
```

AI は「Terraform のコードを書く・コマンドを実行する」役。AWS の操作権限は、あなたが設定する認証情報から得る。

## 2. 用語の解説

### AWS（Amazon Web Services）

Amazon が提供するクラウドサービス。サーバーやデータベースを「借りて」使い、使った分だけ課金される（従量課金）。

| サービス | 役割 | このアプリでの用途 |
|---|---|---|
| EC2 | 仮想サーバー | Spring Boot を動かす |
| RDS | マネージドDB | PostgreSQL を動かす |
| S3 | ファイル置き場 | React のビルド成果物を置く |
| CloudFront | CDN（配信網） | React を高速・HTTPS で配信 |
| VPC | 仮想ネットワーク | 各サービスを置く専用ネットワーク |
| Security Group | ファイアウォール | 「誰がどのポートに接続できるか」を制御 |
| IAM | 権限管理 | 「誰が何を操作できるか」を制御 |

### AWS CLI

ブラウザのコンソールを使わず、ターミナルから AWS を操作するツール（例: `aws s3 ls`）。AI がコマンドで操作できるのはこのため。

### IaC（Infrastructure as Code）

インフラの構成をコードで管理する考え方。

| 手動（コンソール） | IaC |
|---|---|
| クリック操作で再現できない | コードなので何度でも同じ環境を作れる |
| 何を作ったか忘れる | Git で履歴管理できる |
| 消し忘れて課金される | コマンド1つで全部削除できる |

### Terraform

IaC を実現するツール（HashiCorp 社製）。`.tf` ファイルに「こういう構成にしたい」と書くと、現状との差分を計算して AWS に反映する。

```hcl
# 例: S3バケットを1つ作る
resource "aws_s3_bucket" "frontend" {
  bucket = "taskmanagement-frontend-xxxx"
}
```

#### 基本の4コマンド

| コマンド | 意味 |
|---|---|
| `terraform init` | 初期化（AWS 用プラグインのダウンロード） |
| `terraform plan` | 実行前の確認。何が作成・変更・削除されるか表示（AWS は変更されない） |
| `terraform apply` | 実際に AWS へ反映（課金が発生しうる） |
| `terraform destroy` | 作ったものを全部削除 |

#### state（状態ファイル）

`terraform.tfstate` は「Terraform が何を作ったか」の記録。壊れたり消えたりすると管理できなくなる。DB パスワードなどの機密情報が入ることがあるため、**Git にコミットしてはいけない**（`.gitignore` に入れる）。

## 3. 構成案

このアプリ（Spring Boot + React + PostgreSQL）向けの2案。

**案A: 学習向け標準構成**

```
ユーザー → CloudFront → S3（React）
        ↘ EC2（Spring Boot）→ RDS（PostgreSQL）
```

AWS の基本要素（ネットワーク・サーバー・DB・配信）を一通り学べる。

**案B: 最安・最小構成**

EC2 1台に Spring Boot・React・PostgreSQL をすべて載せる。安く簡単だが、本番的な構成ではない。

## 4. 事前準備の手順（人が手動で行う部分）

アカウント作成と認証の初期設定は、AI に任せず本人が行う。

### ステップ1: AWS アカウント作成

1. https://aws.amazon.com/ から作成（メールアドレス・クレジットカード・電話番号が必要）
2. 作成直後のアカウントは**ルートユーザー**（全権限を持つ）。普段の作業には使わない。

### ステップ2: ルートユーザーの保護

- MFA（多要素認証）を有効化する
- ルートユーザーのアクセスキーは作らない

### ステップ3: 課金アラートの設定

課金事故を防ぐため、請求ダッシュボードの「Budgets」で月額上限（例: 1,000円）を設定し、超えそうなときにメールが届くようにする。

### ステップ4: 作業用ユーザーの作成

| 方式 | 特徴 |
|---|---|
| IAM Identity Center（SSO） | 一時的な認証情報で安全。推奨 |
| IAM ユーザー + アクセスキー | 簡単だが、キー漏洩のリスクが高い |

IAM ユーザーを使う場合は、キーを Git に絶対コミットしないこと。

### ステップ5: AWS CLI と Terraform のインストール（Mac）

```bash
brew install awscli
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

aws --version
terraform version
```

### ステップ6: CLI の認証設定

```bash
# SSO の場合
aws configure sso
aws sso login --profile <プロファイル名>

# IAM ユーザーの場合
aws configure
```

### ステップ7: 認証の確認

```bash
aws sts get-caller-identity
```

自分のアカウント ID が表示されれば成功。ここまで終われば AI に作業を依頼できる。

## 5. AI にデプロイさせるときの注意

| 注意点 | 理由 |
|---|---|
| `plan` の結果は必ず自分で確認してから `apply` | 意図しないリソース作成・削除を防ぐ |
| 認証情報・`.tfstate`・`.tfvars` を Git に入れない | 漏洩すると不正利用され、高額請求になることがある |
| 権限は必要最小限にする | AI が誤って重要なものを消すリスクを減らす |
| 使い終わったら `terraform destroy` | 消し忘れ課金を防ぐ |
| DB のパスワードをコードに直書きしない | 変数や Secrets Manager を使う |

## 6. 作業の進め方

このプロジェクトの CLAUDE.md のルールに従う。

1. イシューを起票する
2. main からブランチを切る（例: `chore/#N-terraform-aws-deploy`）
3. 次のものを作成する
   - `infra/`（Terraform コード）
   - バックエンドの `Dockerfile` や本番用設定
   - デプロイ手順書（`docs/`）
4. `plan` を確認し、`apply` を実行する
5. PR を作成する
