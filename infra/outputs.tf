output "instance_id" {
  description = "EC2のインスタンスID"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "EC2の公開IPアドレス（再起動すると変わる）"
  value       = aws_instance.app.public_ip
}

output "deploy_bucket" {
  description = "デプロイ成果物の転送用S3バケット名"
  value       = aws_s3_bucket.deploy.bucket
}

output "ssm_connect_command" {
  description = "SSM Session Manager で接続するコマンド（要: session-manager-plugin）"
  value       = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.aws_region}"
}
