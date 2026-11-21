#!/bin/bash
# フロントエンドをビルドして EC2 にデプロイするスクリプト（手元のMacで実行）
#
# 使い方:
#   bash infra/scripts/deploy-frontend.sh --setup   # 初回: Nginxの構築 + デプロイ
#   bash infra/scripts/deploy-frontend.sh           # 2回目以降: ビルド + デプロイのみ
#
# 流れ: Macでビルド → S3にアップロード → SSM経由でEC2が取得 → Nginxの公開フォルダに配置
set -euo pipefail

REGION=ap-northeast-1
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA_DIR="${REPO_ROOT}/infra"

BUCKET=$(terraform -chdir="${INFRA_DIR}" output -raw deploy_bucket)
INSTANCE_ID=$(terraform -chdir="${INFRA_DIR}" output -raw instance_id)

# SSM でコマンドを送って完了を待ち、出力を表示する
ssm_run() {
  local cid status
  cid=$(aws ssm send-command --region "${REGION}" --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript --timeout-seconds 600 \
    --parameters "$1" --query 'Command.CommandId' --output text)
  for _ in $(seq 1 60); do
    status=$(aws ssm get-command-invocation --region "${REGION}" --command-id "${cid}" \
      --instance-id "${INSTANCE_ID}" --query 'Status' --output text 2>/dev/null || echo Pending)
    case "${status}" in InProgress|Pending|Delayed) sleep 5 ;; *) break ;; esac
  done
  aws ssm get-command-invocation --region "${REGION}" --command-id "${cid}" \
    --instance-id "${INSTANCE_ID}" --query '[StandardOutputContent,StandardErrorContent]' --output text
  [ "${status}" = "Success" ] || { echo "失敗: ${status}" >&2; exit 1; }
}

if [ "${1:-}" = "--setup" ]; then
  echo "== EC2の環境構築（setup-frontend.sh を実行） =="
  SETUP_B64=$(gzip -c "${INFRA_DIR}/scripts/setup-frontend.sh" | base64 | tr -d '\n')
  CONF_B64=$(gzip -c "${INFRA_DIR}/nginx/taskmanagement.conf" | base64 | tr -d '\n')
  ssm_run "commands=[\"echo ${SETUP_B64} | base64 -d | gunzip > /tmp/setup-frontend.sh\",\"NGINX_CONF_B64=${CONF_B64} bash /tmp/setup-frontend.sh\",\"rm -f /tmp/setup-frontend.sh\"]"
fi

echo "== フロントエンドをビルド =="
# --legacy-peer-deps: ESLint(開発用ツール)とプラグインのバージョン不一致を無視する。ビルドには影響しない
( cd "${REPO_ROOT}/frontend" && npm ci --legacy-peer-deps --silent && npm run build --silent )

echo "== S3 にアップロード（dist/ を丸ごと同期） =="
aws s3 sync "${REPO_ROOT}/frontend/dist/" "s3://${BUCKET}/frontend/" --delete --region "${REGION}" --only-show-errors

echo "== EC2 に配置 =="
ssm_run "commands=[\"aws s3 sync s3://${BUCKET}/frontend/ /usr/share/nginx/html/ --delete --region ${REGION} --only-show-errors\",\"chmod -R a+rX /usr/share/nginx/html\",\"systemctl reload nginx\",\"ls /usr/share/nginx/html | head\"]"
