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

## GitHub ワークフロールール（厳守）

### 大原則
- **main ブランチへの直接プッシュは絶対禁止**
- 作業は必ずイシュー起票 → ブランチ作成 → PR → レビュー → マージの順で行う

### イシュー登録ルール
- 作業を始める前に必ずイシューを登録する
- タイトルは日本語で、何をするかが一目でわかるように書く
- ラベルを必ず1つ以上付ける（下記参照）
- 作業内容・完了条件を本文に記載する

### ラベル一覧
| ラベル | 用途 |
|--------|------|
| `feature` | 新機能の追加 |
| `bug` | バグ修正 |
| `refactor` | リファクタリング |
| `docs` | ドキュメント更新 |
| `test` | テスト追加・修正 |
| `chore` | 依存関係更新・設定変更など |

### ブランチ命名規則
```
{type}/#{issue番号}-{内容を英語で短く}
```
例：
- `feature/#5-task-create-api`
- `bug/#12-fix-null-pointer`
- `refactor/#8-extract-service-layer`

### プルリクエストルール
- タイトルは `[#イシュー番号] 日本語でやったこと` の形式
- 本文に `Closes #イシュー番号` を記載してイシューと紐付ける
- main への直接プッシュは禁止（ブランチ保護により強制）

### Claude Code での作業手順
1. `gh issue create` でイシューを起票
2. `git checkout -b feature/#N-description` でブランチ作成
3. 実装・コミット
4. `gh pr create` でPRを作成
5. PRをマージしてブランチを削除

### コミットメッセージ規則
フォーマット: `{type}: {日本語で内容を簡潔に}`

| type | 用途 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング |
| `docs` | ドキュメント更新 |
| `test` | テスト追加・修正 |
| `chore` | 依存関係更新・設定変更など |

例：
- `feat: タスク作成APIを追加`
- `fix: タスク削除時のNullPointerExceptionを修正`
- `docs: APIドキュメントを更新`

## サーバー起動ルール（厳守）

### 使用ポート
| サーバー | ポート |
|---------|--------|
| バックエンド（Spring Boot） | 8080 |
| フロントエンド（Vite） | 5173 |

### ポート競合時の対応（必須）

サーバーを起動する前に必ずポートの使用状況を確認し、**競合している場合は既存プロセスを停止してから起動すること。**
別ポートで一時的に起動することは禁止。必ず上記の指定ポートで起動すること。

```bash
# バックエンド起動（ポート 8080）
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
cd backend && mvn spring-boot:run

# フロントエンド起動（ポート 5173）
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
cd frontend && npm run dev
```

## Claude Code への必須ルール（絶対に守ること）

以下のルールはいかなる場合も例外なく守ること。

1. **コードの変更を伴う作業は必ずイシューを起票してから始める**
2. **作業は必ず専用ブランチを切って行う（main ブランチへの直接コミット・プッシュは絶対禁止）**
3. **ブランチ名は命名規則 `{type}/#{issue番号}-{英語で内容}` に従う**
4. **実装完了後は必ず PR を作成する（main への直接マージ禁止）**
5. **コミットメッセージは上記の規則に従い日本語で記載する**
6. **サーバー起動前にポート競合を確認し、競合があれば既存プロセスを停止してから指定ポートで起動する**

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
