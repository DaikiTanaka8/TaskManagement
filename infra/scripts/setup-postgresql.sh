#!/bin/bash
# EC2(Amazon Linux 2023)に PostgreSQL をセットアップするスクリプト
#
# 使い方（EC2上で root として実行）:
#   DB_PASSWORD='パスワード' bash setup-postgresql.sh
#
# - パスワードはスクリプトに書かず、環境変数 DB_PASSWORD で渡す
# - 何度実行しても同じ結果になる（すでにあるものは作り直さない）
# - PostgreSQL は localhost のみで待ち受ける（外部には公開しない）
set -euo pipefail

: "${DB_PASSWORD:?環境変数 DB_PASSWORD を指定してください}"

PG_VERSION=17
DB_NAME=taskmanagement   # backend/src/main/resources/application.properties に合わせる
DB_USER=taskuser

echo "== 1. PostgreSQL ${PG_VERSION} をインストール =="
dnf install -y "postgresql${PG_VERSION}" "postgresql${PG_VERSION}-server"

echo "== 2. DBクラスタを初期化（初回のみ） =="
if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
  postgresql-setup --initdb
fi

echo "== 3. パスワード認証を有効化（localhostからの接続） =="
# 'host' の接続方式を ident から scram-sha-256（パスワード認証）に変更
sed -i -E '/^host/ s/(ident|trust|peer)$/scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf

echo "== 4. 起動と自動起動の設定 =="
systemctl enable postgresql
systemctl restart postgresql

echo "== 5. ユーザーとDBを作成 =="
psql_admin() { runuser -u postgres -- psql -v ON_ERROR_STOP=1 "$@"; }

if ! psql_admin -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  psql_admin -c "CREATE ROLE ${DB_USER} LOGIN"
fi
# パスワードは psql の変数経由で渡す（引用符や特殊文字でも安全）
psql_admin -v pw="${DB_PASSWORD}" <<< "ALTER ROLE ${DB_USER} PASSWORD :'pw';"

if ! psql_admin -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  psql_admin -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}"
fi

echo "== 完了 =="
systemctl is-active postgresql
