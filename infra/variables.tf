variable "aws_region" {
  description = "AWSリージョン（東京）"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "リソース名の接頭辞・タグに使うプロジェクト名"
  type        = string
  default     = "taskmanagement"
}

variable "instance_type" {
  description = "EC2のインスタンスタイプ"
  type        = string
  default     = "t3.micro"
}

variable "my_ip_cidr" {
  description = "アクセスを許可する自分のIP（例: 203.0.113.5/32）。terraform.tfvars に書く"
  type        = string

  validation {
    # 0.0.0.0/0（全世界に公開）を誤って指定できないようにする
    condition     = can(cidrhost(var.my_ip_cidr, 0)) && var.my_ip_cidr != "0.0.0.0/0"
    error_message = "my_ip_cidr は 203.0.113.5/32 の形式で、0.0.0.0/0 以外を指定してください。"
  }
}
