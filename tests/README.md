# Next.js フロントエンドテストスイート

ソーシャルナビゲーター フロントエンドのテストスイートです。

## 📁 ディレクトリ構成

```
tests/
├── unit/                    # 単体テスト
│   ├── components/         # コンポーネントテスト
│   ├── hooks/             # カスタムフックテスト
│   └── utils/             # ユーティリティテスト
├── integration/            # 画面統合テスト
│   ├── auth.spec.js       # 認証画面
│   ├── dashboard.spec.js  # ダッシュボード
│   ├── clients.spec.js    # クライアント管理
│   ├── companies.spec.js  # 企業管理
│   └── projects.spec.js   # 案件管理
├── e2e/                   # E2E統合テスト
│   ├── auth-flow.spec.js  # 認証フロー
│   ├── crud-flow.spec.js  # CRUD操作フロー
│   └── search-flow.spec.js # 検索・フィルタフロー
├── fixtures/              # テストデータ
│   ├── mock-responses.json
│   └── test-scenarios.json
├── playwright.config.js   # Playwright設定
├── jest.config.js         # Jest設定
└── README.md              # このファイル
```

## 🚀 実行方法

### 単体テスト（Jest）
```bash
# 全コンポーネントテスト
pnpm run test

# 特定コンポーネント
pnpm run test -- components/auth/login-form.test.js

# ウォッチモード
pnpm run test:watch
```

### 統合テスト（Playwright）
```bash
# 画面統合テスト
pnpm run test:integration

# デバッグモード
pnpm run test:integration:debug
```

### E2Eテスト（Playwright）
```bash
# フロント↔バックエンド統合テスト
pnpm run test:e2e

# UIモード
pnpm run test:e2e:ui
```

## 📋 テスト対象

### v0レポート関連テスト
- ✅ 認証システム（モックユーザー → 実際のAPI）
- ✅ ダッシュボード統計（ハードコーディング → 動的データ）
- ✅ マスターデータ（ハードコーディング → API取得）
- ✅ 企業作成機能
- ✅ プロジェクト削除機能

### UI/UXテスト
- ページ表示・レンダリング
- フォーム操作・バリデーション
- ナビゲーション・ルーティング
- 検索・フィルタ機能
- レスポンシブデザイン

### 統合テスト
- API連携動作
- エラーハンドリング
- ローディング状態
- データ更新反映

## 🔧 テスト環境

- **Next.js**: localhost:3002
- **Django API**: localhost:8080
- **テストフレームワーク**: Jest + Playwright
- **ブラウザ**: Chromium, Firefox, WebKit