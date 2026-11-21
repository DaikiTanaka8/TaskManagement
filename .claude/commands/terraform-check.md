Terraform（`infra/`）の品質チェックを実行し、結果を日本語で報告してください。AWSのリソースは作成・変更しません（読み取りのみ）。

手順:
1. 書式チェック: `cd infra && terraform fmt -check -recursive -diff`
   - 差分があれば `terraform fmt` で整形する（整形後に差分を報告）
2. 文法チェック: `cd infra && terraform validate`
3. リント（`tflint` が入っている場合のみ）: `cd infra && tflint`
   - `tflint` 未インストールの場合は「未実施」と報告し、導入方法を案内する（Homebrew に無いため、GitHub Releases の公式バイナリをチェックサム検証してから `~/.local/bin/` に置く）
   - `.tflint.hcl` を追加した場合は、その設定を使う（`tflint --init` でプラグインを取得）
4. セキュリティチェック: `trivy config --skip-dirs infra/.terraform infra`
   - `trivy` 未インストールの場合は `brew install trivy`
   - 意図的に許容している指摘は、該当リソースの直前に `#trivy:ignore:AVD-AWS-XXXX` と、許容する理由のコメントで残している（`infra/main.tf` / `infra/s3.tf`）。新たに無視を追加するときも、理由を必ず書く
5. 機密ファイルの混入チェック: `git ls-files infra | grep -E "tfstate|tfvars$|db-password" ` が何も出力しないこと（`terraform.tfvars.example` は可）

報告のルール:
- 各チェックの結果（OK / 指摘あり）を表で示す
- 指摘は「重大度・場所（ファイル:行）・内容・修正案」を日本語で説明する
- 指摘ごとに「修正する」「意図的に許容する（理由を書いて無視設定にする）」のどちらが妥当か意見を述べ、**修正はユーザーの確認を取ってから行う**
- EC2 の作り直し（再作成）を伴う修正は、データが消えることを必ず事前に伝える
- コスト削減のために意図的に省いている項目（RDS・ALB・CloudFront・ログ出力など）は、無視してよい理由を添える

変更を加えた場合は、CLAUDE.md のルールどおり、イシュー起票 → ブランチ → PR の順で進めること。
