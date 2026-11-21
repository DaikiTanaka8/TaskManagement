#!/bin/bash
# EC2(Amazon Linux 2023)に Nginx をセットアップするスクリプト
#
# 使い方（EC2上で root として実行。通常は deploy-frontend.sh --setup が実行する）:
#   NGINX_CONF_B64='<taskmanagement.conf を gzip+base64 したもの>' bash setup-frontend.sh
#
# - Nginx のインストール / 設定ファイル配置 / 起動と自動起動
# - 何度実行しても同じ結果になる
# - 設定ファイル側で default_server を指定しているため、Nginx 標準の設定よりこちらが優先される
set -euo pipefail

: "${NGINX_CONF_B64:?環境変数 NGINX_CONF_B64 を指定してください}"

echo "== 1. Nginx をインストール =="
dnf install -y nginx

echo "== 2. 設定ファイルを配置 =="
echo "${NGINX_CONF_B64}" | base64 -d | gunzip > /etc/nginx/conf.d/taskmanagement.conf

echo "== 3. 画面ファイルの置き場所 =="
mkdir -p /usr/share/nginx/html

echo "== 4. 設定チェックと起動 =="
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "== 完了 =="
systemctl is-active nginx
