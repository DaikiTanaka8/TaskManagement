# TaskManagement

Trello 風のタスク管理 Web アプリケーションです。タスクをジャンル別・期限別に整理し、ドラッグ＆ドロップで並び替えができます。

## 目次

- [機能](#機能)
- [技術スタック](#技術スタック)
- [プロジェクト構成](#プロジェクト構成)
- [セットアップ](#セットアップ)
- [API 設計](#api-設計)
- [DB 設計](#db-設計)
- [画面構成](#画面構成)

---

## 機能

### タスク機能

| No. | 機能 | 説明 |
|-----|------|------|
| F01 | タスク作成 | タスクを新規作成できる |
| F02 | タスク編集 | 登録済みのタスクを編集できる |
| F03 | タスク削除 | 登録済みのタスクを削除できる |
| F04 | タスク完了 | タスクに完了チェックをつけられる |
| F05 | 完了済み移動 | 完了チェックをつけたタスクは「完了済みエリア」に移動する |

#### タスクに登録できる情報

| 項目 | 必須/任意 | 説明 |
|------|----------|------|
| タイトル | 必須 | タスクの名前 |
| メモ・説明文 | 任意 | タスクの詳細や補足 |
| 期限（日付） | 任意 | タスクの締め切り日 |
| ジャンル | 任意 | 仕事・家庭・趣味・買い物 から選択 |

### 表示・操作機能

| No. | 機能 | 説明 |
|-----|------|------|
| F06 | ジャンル別表示 | タスクをジャンルごとに分けて表示する（初期表示） |
| F07 | 期限別表示への切り替え | ボタン操作で期限別の表示に切り替えられる |
| F08 | ドラッグ＆ドロップ | タスクをドラッグ＆ドロップで移動・並び替えできる |

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | React | 19.2.5 |
| フロントエンド ビルドツール | Vite | 8.0.10 |
| HTTP クライアント | axios | 1.15.2 |
| バックエンド | Spring Boot | 4.0.5 |
| バックエンド ランタイム | Java | 25 |
| ORM | Spring Data JPA（Hibernate） | Spring Boot 同梱 |
| DB マイグレーション | Flyway | Spring Boot 同梱 |
| データベース | PostgreSQL | - |

---

## プロジェクト構成

```
TaskManagement/
├── backend/          # Spring Boot アプリケーション（ポート 8080）
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
├── frontend/         # React アプリケーション（ポート 5173）
│   ├── src/
│   └── package.json
└── docs/             # 設計ドキュメント
    ├── 機能要件.md
    ├── 技術スタック.md
    ├── 画面設計.md
    └── DB設計.md
```

---

## セットアップ

### 前提条件

- Java 25
- Maven
- Node.js（npm）
- PostgreSQL

### リポジトリのクローン

```bash
git clone https://github.com/DaikiTanaka8/TaskManagement.git
cd TaskManagement
```

### バックエンド起動

```bash
# ポート競合があれば既存プロセスを停止
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

cd backend
mvn spring-boot:run
# → http://localhost:8080
```

### フロントエンド起動

```bash
# ポート競合があれば既存プロセスを停止
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

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

---

## DB 設計

### tasks テーブル

| カラム名 | 型 | 必須 | 説明 |
|---------|-----|------|------|
| id | INTEGER PK | ○ | 主キー（自動採番） |
| title | VARCHAR | ○ | タスクのタイトル |
| memo | TEXT | - | メモ・説明文 |
| due_date | DATE | - | 期限日 |
| genre | VARCHAR | - | ジャンル（仕事／家庭／趣味／買い物） |
| is_completed | BOOLEAN | ○ | 完了フラグ（デフォルト: false） |
| sort_order | INTEGER | ○ | 表示順（ドラッグ＆ドロップ用） |
| created_at | DATETIME | ○ | 作成日時 |
| updated_at | DATETIME | ○ | 更新日時 |

---

## 画面構成

| No. | 画面名 | 説明 |
|-----|--------|------|
| S01 | ボード画面（メイン） | タスク一覧を表示するメイン画面。初期表示はジャンル別。 |
| S02 | タスク詳細画面 | タスクの作成・編集・内容確認を行う画面。 |

詳細な画面設計は [docs/画面設計.md](docs/画面設計.md) を参照してください。

---

## 作者

[DaikiTanaka8](https://github.com/DaikiTanaka8)
