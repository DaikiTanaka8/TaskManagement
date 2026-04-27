ポート8080の競合を確認し、既存プロセスを停止してからSpring Bootバックエンドを起動してください。

手順:
1. `lsof -ti:8080 | xargs kill -9 2>/dev/null || true` を実行してポートを解放
2. `cd backend && mvn spring-boot:run` でサーバーを起動
