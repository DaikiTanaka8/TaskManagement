# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技術スタック

- **バックエンド:** Java 25 + Spring Boot 4.0.x, Maven, Spring Data JPA (Hibernate), Flyway
- **フロントエンド:** React（Next.js は対象外）
- **データベース:** PostgreSQL

## プロジェクト構成（予定）

```
TaskManagement/
├── backend/          # Spring Boot アプリケーション
│   ├── src/main/java/com/taskmanagement/
│   │   ├── controller/   # REST コントローラー
│   │   ├── service/      # ビジネスロジック
│   │   ├── repository/   # Spring Data JPA リポジトリ
│   │   ├── entity/       # JPA エンティティ
│   │   └── dto/          # リクエスト/レスポンス DTO
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/ # Flyway マイグレーションファイル
│   └── pom.xml
├── frontend/         # React アプリケーション（未着手）
└── docs/             # 設計ドキュメント
```

## バックエンドのコマンド

```bash
cd backend
mvn spring-boot:run          # 開発サーバー起動（ポート 8080）
mvn test                     # 全テスト実行
mvn test -Dtest=ClassName    # 特定のテストクラスのみ実行
mvn clean package            # JAR ビルド
```

## データベース

テーブルは `tasks` の1つのみ。

| カラム名 | 型 | 備考 |
|---------|-----|------|
| id | INTEGER PK | 自動採番 |
| title | VARCHAR | 必須 |
| memo | TEXT | 任意 |
| due_date | DATE | 任意 |
| genre | VARCHAR | 仕事/家庭/趣味/買い物 |
| is_completed | BOOLEAN | デフォルト false |
| sort_order | INTEGER | ドラッグ&ドロップ用 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

## API 設計

ベースURL: `http://localhost:8080/api`

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /tasks | タスク一覧取得 |
| POST | /tasks | タスク作成 |
| PUT | /tasks/{id} | タスク更新 |
| DELETE | /tasks/{id} | タスク削除 |
| PATCH | /tasks/{id}/complete | 完了フラグ切り替え |
| PUT | /tasks/reorder | 表示順更新 |
