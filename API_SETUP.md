# API接続設定ガイド

## モックAPIサーバー情報
- **URL**: https://saleslist-mock-api.onrender.com
- **状態**: ✅ 稼働中
- **OpenAPI仕様書**: `/saleslist-backend/deployment/swagger/openapi.yaml`

## セットアップ完了項目

### ✅ 1. 環境変数の設定
以下のファイルを作成済み：
- `.env.local` - 本番環境用設定
- `.env.development` - 開発環境用設定（CORS回避プロキシ使用）

### ✅ 2. API Clientの実装
`/lib/api-client.ts` に以下の機能を実装済み：
- JWTトークン管理
- 自動トークンリフレッシュ（401エラー時）
- エラーハンドリング
- ファイルアップロード/ダウンロード対応

### ✅ 3. 認証フローの実装
`/lib/auth.ts` と `/hooks/use-auth.tsx` で実装：
- ログイン/ログアウト
- トークンの永続化（localStorage）
- 認証状態の管理

### ✅ 4. CORS対策
`next.config.mjs` に以下を設定：
- 開発環境用プロキシ（`/api/proxy/*`）
- CORSヘッダーの設定

### ✅ 5. 型定義
`/lib/types.ts` に全エンティティの型定義を追加：
- Company, Project, Executive
- API レスポンス型
- フォームデータ型

## テスト用認証情報
```javascript
// ログインテスト用
const testCredentials = {
  email: "user@example.com",
  password: "password123"
}
```

## API呼び出し例

### ログイン
```javascript
import { authService } from '@/lib/auth'

const response = await authService.login({
  email: "user@example.com",
  password: "password123"
})
// response.access_token と response.refresh_token が自動的に保存される
```

### 企業リスト取得
```javascript
import { apiClient } from '@/lib/api-client'
import { API_CONFIG } from '@/lib/api-config'

const companies = await apiClient.get(
  `${API_CONFIG.ENDPOINTS.COMPANIES}?page=1&page_size=50`
)
```

### 認証が必要なAPIの呼び出し
```javascript
// トークンは自動的にヘッダーに追加される
const projects = await apiClient.get(API_CONFIG.ENDPOINTS.PROJECTS)
```

## トラブルシューティング

### 問題: CORSエラー
**解決方法:**
1. 開発環境で実行: `npm run dev`
2. `.env.development` が存在することを確認
3. ブラウザのキャッシュをクリア

### 問題: 401 Unauthorized
**解決方法:**
1. localStorageをクリア: `localStorage.clear()`
2. 再度ログイン

### 問題: ネットワークエラー
**解決方法:**
1. モックサーバーの状態確認: 
   ```bash
   curl https://saleslist-mock-api.onrender.com
   ```
2. ネットワーク接続を確認

## 開発の開始

1. 依存関係のインストール
```bash
npm install
```

2. 開発サーバーの起動
```bash
npm run dev
```

3. ブラウザで確認
```
http://localhost:3000
```

4. ログインページでテスト
- Email: user@example.com
- Password: password123

## API エンドポイント一覧

### 認証
- POST `/auth/login` - ログイン
- POST `/auth/logout` - ログアウト  
- POST `/auth/refresh` - トークンリフレッシュ

### 企業管理
- GET `/companies` - 企業一覧
- GET `/companies/{id}` - 企業詳細
- PUT `/companies/{id}` - 企業更新
- DELETE `/companies/{id}` - 企業削除
- POST `/companies/{id}/toggle_ng` - NG設定切り替え
- GET `/companies/export_csv` - CSVエクスポート
- POST `/companies/import_csv` - CSVインポート

### 案件管理
- GET `/projects` - 案件一覧
- POST `/projects` - 案件作成
- GET `/projects/{id}` - 案件詳細
- PUT `/projects/{id}` - 案件更新
- DELETE `/projects/{id}` - 案件削除
- GET `/projects/{id}/companies` - 案件企業一覧
- POST `/projects/{id}/add_companies` - 企業追加

### 役員管理
- GET `/companies/{id}/executives` - 役員一覧
- POST `/companies/{id}/executives` - 役員追加
- PUT `/executives/{id}` - 役員更新
- DELETE `/executives/{id}` - 役員削除

詳細は `/saleslist-backend/docs/screen_api_mapping.md` を参照してください。