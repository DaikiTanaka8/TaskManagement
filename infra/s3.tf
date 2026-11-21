# ---------------------------------------------------------------
# デプロイ成果物の転送用S3バケット
#   Macでビルドした jar / 画面のファイルをここに置き、EC2が取りに行く。
#   SSH を使わない（SSM のみ）ので、大きなファイルはS3経由で渡す。
#   データは数十MBなので料金はほぼ0円。destroy で中身ごと削除される。
# ---------------------------------------------------------------
data "aws_caller_identity" "current" {}

# trivy の指摘を意図的に許容する理由（一時的な転送用バケットのため）:
#   AWS-0089 ログ無効      : ログの保存は無駄なコストになる
#   AWS-0090 バージョニング: 消えても Mac から再アップロードできる
#   AWS-0132 KMS(CMK)暗号化: S3 は AWS 管理キー(SSE-S3)で自動暗号化済み。
#                            CMK は月額費用と EC2 側の権限追加が必要で目的に合わない
#trivy:ignore:AVD-AWS-0089
#trivy:ignore:AVD-AWS-0090
#trivy:ignore:AVD-AWS-0132
resource "aws_s3_bucket" "deploy" {
  # バケット名は全世界で一意にする必要があるため、アカウントIDを含める
  bucket        = "${var.project_name}-deploy-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # 中にファイルがあっても terraform destroy で削除できる
}

# 外部公開を全面的にブロックする
resource "aws_s3_bucket_public_access_block" "deploy" {
  bucket = aws_s3_bucket.deploy.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# EC2のロールに「このバケットの読み取りのみ」を許可する（書き込み・削除は不可）
data "aws_iam_policy_document" "deploy_read" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.deploy.arn]
  }

  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.deploy.arn}/*"]
  }
}

resource "aws_iam_role_policy" "ec2_deploy_read" {
  name   = "${var.project_name}-deploy-bucket-read"
  role   = aws_iam_role.ec2_ssm.id
  policy = data.aws_iam_policy_document.deploy_read.json
}
