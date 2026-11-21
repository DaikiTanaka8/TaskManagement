#!/bin/bash
# EC2(Amazon Linux 2023)にバックエンド(Spring Boot)の実行環境を作るスクリプト
#
# 使い方（EC2上で root として実行。通常は deploy-backend.sh --setup が実行する）:
#   DB_PASSWORD='パスワード' bash setup-backend.sh
#
# - Java 25 のインストール / スワップ作成 / サービスユーザー / systemd サービス登録
# - 何度実行しても同じ結果になる（すでにあるものは作り直さない）
# - アプリは 127.0.0.1:8080 のみで待ち受ける（外部には公開しない）
set -euo pipefail

: "${DB_PASSWORD:?環境変数 DB_PASSWORD を指定してください}"

APP_USER=taskapp
APP_DIR=/opt/taskmanagement
ENV_FILE=/etc/taskmanagement.env
SERVICE_FILE=/etc/systemd/system/taskmanagement.service

echo "== 1. Java 25 をインストール =="
if command -v java >/dev/null 2>&1 && java -version 2>&1 | grep -q '"25'; then
  echo "Java 25 は導入済み"
elif dnf list available java-25-amazon-corretto-headless >/dev/null 2>&1; then
  dnf install -y java-25-amazon-corretto-headless
else
  echo "dnf に Java 25 が無いため、Corretto の公式アーカイブを使います"
  curl -fsSL -o /tmp/corretto25.tar.gz \
    https://corretto.aws/downloads/latest/amazon-corretto-25-x64-linux-jdk.tar.gz
  mkdir -p /opt/corretto-25
  tar -xzf /tmp/corretto25.tar.gz -C /opt/corretto-25 --strip-components=1
  ln -sf /opt/corretto-25/bin/java /usr/bin/java
  rm -f /tmp/corretto25.tar.gz
fi
java -version 2>&1 | head -1

echo "== 2. スワップ(1GB)を作成（メモリ不足対策。初回のみ） =="
if ! swapon --show | grep -q /swapfile; then
  if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
  fi
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon --show

echo "== 3. サービス用ユーザーとフォルダ =="
id "${APP_USER}" >/dev/null 2>&1 || useradd --system --shell /sbin/nologin "${APP_USER}"
mkdir -p "${APP_DIR}"
chown "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo "== 4. 環境変数ファイル（root のみ読める） =="
(
  umask 077
  cat > "${ENV_FILE}" <<EOF
SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
SERVER_ADDRESS=127.0.0.1
EOF
)
chmod 600 "${ENV_FILE}"

echo "== 5. systemd サービスを登録 =="
cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=TaskManagement backend (Spring Boot)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
User=${APP_USER}
EnvironmentFile=${ENV_FILE}
Environment="JAVA_OPTS=-Xms128m -Xmx384m"
ExecStart=/usr/bin/java \$JAVA_OPTS -jar ${APP_DIR}/app.jar
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable taskmanagement

echo "== 完了（jar が配置されたら deploy-backend.sh で起動します） =="
