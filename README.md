# ソーシャルナビゲーター フロントエンド

Next.js + React による BtoB営業支援プラットフォームのフロントエンドアプリケーション

## 📄 設計ドキュメント

設計書や運用ルール（`AGENTS.md` など）はリポジトリ `saleslist-docs` で一元管理しています。
詳細は以下をご確認ください。
- https://github.com/eastcloud-corp/saleslist-docs

## 🚀 起動手順

### **1. 依存関係のインストール**
```bash
npm install
```

### **2. 環境変数の設定**
```bash
# .env.local ファイルを作成（初回のみ）
cp .env.development .env.local

# 環境変数の内容
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

### **3. 開発サーバーの起動**
```bash
# 開発サーバー起動
npm run dev

# アプリケーションが http://localhost:3000 で起動
```

### **4. Dockerを使用した起動**
```bash
# ルートディレクトリで全体起動
cd ../
docker-compose -f saleslist-backend/docker/docker-compose.yml up

# フロントエンドは http://localhost:3002 で起動
```

## 🔧 技術スタック

- **Next.js**: 15.2.4
- **React**: 19
- **TypeScript**: 5
- **Tailwind CSS**: 4.1.9
- **UI Components**: Radix UI
- **Form管理**: React Hook Form + Zod
- **アイコン**: Lucide React
- **テーマ**: next-themes
- **グラフ**: Recharts

## 🧪 テスト実行

```bash
# 単体テスト
npm run test

# 単体テスト（ウォッチモード）
npm run test:watch

# 統合テスト
npm run test:integration

# E2Eテスト
npm run test:e2e

# 全テスト実行
npm run test:all
```

## 🛠️ 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# Linting
npm run lint
```

## 📱 主要機能

### **認証・ユーザー管理**
- ログイン・ログアウト
- ユーザー一覧・作成・編集

### **プロジェクト管理**
- プロジェクト一覧・作成・編集
- 企業割り当て・営業ステータス管理

### **企業管理**
- 企業検索・フィルタリング
- 企業詳細情報表示・編集
- NG企業管理

### **ダッシュボード**
- 営業統計・グラフ表示
- 最近のアクティビティ
- プロジェクト進捗状況

## 🔗 API連携

バックエンド（Django）との連携：
- ベースURL: `http://localhost:8080/api/v1`
- 認証: JWT トークン
- CORS設定: 開発環境で `localhost:3000` 許可

## 📁 ディレクトリ構成

```
saleslist-front/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── dashboard/         # ダッシュボード
│   ├── projects/          # プロジェクト管理
│   ├── companies/         # 企業管理
│   └── settings/          # 設定画面
├── components/            # 再利用可能コンポーネント
│   ├── ui/               # UIコンポーネント（Radix UI）
│   └── forms/            # フォームコンポーネント
├── lib/                  # ユーティリティ関数
├── hooks/                # カスタムReact Hooks
├── types/                # TypeScript型定義
└── public/               # 静的ファイル
```

## 🌐 本番デプロイ

```bash
# 本番ビルド
npm run build

# Docker経由でのデプロイ
# docker-compose.yml で設定済み
```

## 📞 サポート

バックエンドAPI仕様については `../saleslist-backend/README.md` を参照
