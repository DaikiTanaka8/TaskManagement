#!/bin/bash
# バックエンドをビルドして EC2 にデプロイするスクリプト（手元のMacで実行）
#
# 使い方:
#   bash infra/scripts/deploy-backend.sh --setup   # 初回: EC2の環境構築 + デプロイ
#   bash infra/scripts/deploy-backend.sh           # 2回目以降: ビルド + デプロイのみ
#
# 流れ: Macでjarをビルド → S3にアップロード → SSM経由でEC2が取得 → サービス再起動
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
  echo "== EC2の環境構築（setup-backend.sh を実行） =="
  PW=$(cat "${INFRA_DIR}/db-password.txt")
  B64=$(gzip -c "${INFRA_DIR}/scripts/setup-backend.sh" | base64 | tr -d '\n')
  ssm_run "commands=[\"echo ${B64} | base64 -d | gunzip > /tmp/setup-backend.sh\",\"DB_PASSWORD=${PW} bash /tmp/setup-backend.sh\",\"rm -f /tmp/setup-backend.sh\"]" \
    | grep -v -F "${PW}"
fi

echo "== jar をビルド =="
mvn -q -f "${REPO_ROOT}/backend/pom.xml" clean package -DskipTests
JAR=$(ls "${REPO_ROOT}"/backend/target/task-management-*.jar | grep -v '\.original$' | head -1)

echo "== S3 にアップロード =="
aws s3 cp "${JAR}" "s3://${BUCKET}/backend/app.jar" --region "${REGION}" --only-show-errors

echo "== EC2 に配置して再起動 =="
ssm_run "commands=[\"aws s3 cp s3://${BUCKET}/backend/app.jar /opt/taskmanagement/app.jar --region ${REGION} --only-show-errors\",\"chown taskapp:taskapp /opt/taskmanagement/app.jar\",\"systemctl restart taskmanagement\",\"sleep 25\",\"systemctl is-active taskmanagement\",\"journalctl -u taskmanagement -n 5 --no-pager\"]"
