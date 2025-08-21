# 営業リスト管理システム - 設計書

## 📚 最新ドキュメント一覧（クライアント中心設計）

このディレクトリには、Vercel v0での実装に必要な最新の設計書が含まれています。

### 🎯 メインドキュメント（v0に提供）
- **[v0_instruction.md](./v0_instruction.md)** - v0向け実装指示書（これを最初に読んでください）

### 📋 詳細設計書
1. **[correct_business_flow.md](./correct_business_flow.md)** - 正しいビジネスフローと画面設計
2. **[DB_design.md](./DB_design.md)** - データベース設計
3. **[client_ng_management_spec.md](./client_ng_management_spec.md)** - クライアント・NG管理統合仕様
4. **[screen_api_specification.md](./screen_api_specification.md)** - 画面・API統合仕様
5. **[implementation_guide.md](./implementation_guide.md)** - 実装ガイド

### 📄 旧ドキュメント（参考）
- **[old/api-endpoints.md](./old/api-endpoints.md)** - 旧API仕様書（GitHubで履歴管理）

## 🔑 重要な変更点

### ビジネスフローの修正
- **クライアント中心**の設計に変更
- スタート画面は `/clients`（クライアント一覧）
- 企業リストはマスタデータとして扱う
- NGリスト管理機能を追加

### 主要機能
1. クライアント管理
2. NGリスト管理（CSVインポート）
3. 企業選択（NG企業の自動除外）
4. 案件・営業進捗管理

### API接続
- モックAPI: https://saleslist-mock-api.onrender.com
- 認証: JWT Bearer Token
- テスト認証情報:
  - Email: user@example.com
  - Password: password123

## 🚀 実装の進め方

1. `v0_instruction.md`を読んで全体像を把握
2. `correct_business_flow.md`でビジネスフローを理解
3. `implementation_guide.md`のコンポーネント例を参照
4. `screen_api_specification.md`で画面とAPIの対応を確認
5. `client_ng_management_spec.md`でNGリスト機能の詳細を理解

## 📌 注意事項

- すべてのUIは**日本語**で実装
- **クライアント中心**のフローを必ず守る
- 企業リストは管理画面扱い
- NGリスト管理機能は必須

## 🛠 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS + shadcn/ui
- **認証**: JWT Bearer Token
- **フォーム**: React Hook Form + Zod
- **状態管理**: React Context API / Zustand（必要に応じて）

## 開発状況

### 実装済み
- ✅ 基本的なフロントエンド構造
- ✅ APIクライアント（トークン管理含む）
- ✅ 認証フロー

### 要実装（優先度順）
- 🔲 クライアント一覧・詳細画面
- 🔲 NGリスト管理機能（CSVインポート）
- 🔲 企業選択画面（NG企業グレーアウト）
- 🔲 案件詳細・営業進捗管理
- 🔲 企業マスタ管理（管理画面）
