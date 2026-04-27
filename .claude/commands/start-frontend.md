ポート5173の競合を確認し、既存プロセスを停止してからVite + Reactフロントエンドを起動してください。

手順:
1. `lsof -ti:5173 | xargs kill -9 2>/dev/null || true` を実行してポートを解放
2. `cd frontend && npm run dev` でサーバーを起動
