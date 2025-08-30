# APIデータ不足・ハードコーディング箇所レポート

## 概要
フロントエンド実装において、APIから取得できていないデータやハードコーディングされている箇所を整理し、バックエンド実装の参考資料として提供します。

## 1. ダッシュボード統計データ（高優先度）

**ファイル**: `app/dashboard/page.tsx`
**問題**: 全ての統計データがハードコーディング
**必要なAPI**:
\`\`\`typescript
GET /dashboard/stats
{
  totalCompanies: number,
  activeProjects: number,
  prospectCompanies: number,
  completedDeals: number
}

GET /dashboard/recent-projects
{
  results: Array<{
    id: number,
    name: string,
    status: string,
    companies: number
  }>
}

GET /dashboard/recent-companies
{
  results: Array<{
    id: number,
    name: string,
    industry: string,
    status: string
  }>
}
\`\`\`

## 2. 認証システム（高優先度）

**ファイル**: `hooks/use-auth.tsx`
**問題**: トークン存在時にモックユーザーを設定
**必要なAPI**:
\`\`\`typescript
GET /auth/me
{
  id: string,
  email: string,
  name: string,
  role: string,
  created_at: string,
  updated_at: string
}
\`\`\`

## 3. マスターデータ（中優先度）

### 業界リスト
**ファイル**: 
- `components/companies/company-filters.tsx`
- `components/clients/client-form.tsx`
- `components/companies/company-form.tsx`

**問題**: 業界選択肢がハードコーディング
**必要なAPI**:
\`\`\`typescript
GET /master/industries
{
  results: Array<{
    id: string,
    name: string,
    is_active: boolean
  }>
}
\`\`\`

### ステータスマスター
**必要なAPI**:
\`\`\`typescript
GET /master/statuses
{
  results: Array<{
    id: string,
    name: string,
    category: string, // "company" | "project" | "contact"
    is_active: boolean
  }>
}
\`\`\`

## 4. フォールバックデータ（中優先度）

### 企業詳細
**ファイル**: `hooks/use-company.tsx`
**問題**: API失敗時にモック企業データを表示
**対応**: APIエラー時の適切なエラーハンドリング実装

### プロジェクト詳細
**ファイル**: `hooks/use-project.tsx`
**問題**: API失敗時にモックプロジェクトデータを表示
**対応**: APIエラー時の適切なエラーハンドリング実装

## 5. 未実装API呼び出し（高優先度）

### 企業作成
**ファイル**: `app/companies/new/page.tsx`
**コメント**: "TODO: Implement create company API call"
**必要なAPI**:
\`\`\`typescript
POST /companies
{
  name: string,
  industry: string,
  employee_count?: number,
  revenue?: number,
  // ... その他フィールド
}
\`\`\`

### プロジェクト削除
**ファイル**: `app/projects/[id]/project-detail-client.tsx`
**コメント**: "TODO: Implement delete project API call"
**必要なAPI**:
\`\`\`typescript
DELETE /projects/{id}
\`\`\`

## 6. CSVテンプレート（低優先度）

**ファイル**: `components/companies/csv-template-download.tsx`
**問題**: サンプルデータがハードコーディング
**対応**: 動的なテンプレート生成またはサーバーサイドでのテンプレート提供

## 7. 現在のAPIデータ問題

### 案件データの不整合
**問題**: 
- 案件API: `client_company: "株式会社クライアント"` (存在しないクライアント)
- クライアントAPI: 正しいクライアントデータを返している

**対応**: 案件データに正しい`client_id`を設定し、クライアント情報との関連付けを修正

### NGリストデータ
**問題**: NGリストAPIが空のオブジェクト`{}`を返している
**必要なレスポンス**:
\`\`\`typescript
GET /clients/{id}/ng-companies
{
  count: number,
  matched_count: number,
  unmatched_count: number,
  results: Array<{
    id: number,
    client_id: number,
    company_name: string,
    company_id?: number,
    matched: boolean,
    reason?: string,
    is_active: boolean,
    created_at: string,
    updated_at: string
  }>
}
\`\`\`

## 8. 実装優先度

### Phase 1（即座に対応）
1. 認証システムの完全実装
2. 案件データのクライアント関連付け修正
3. 企業・プロジェクト作成/削除API実装

### Phase 2（1週間以内）
1. ダッシュボード統計データAPI実装
2. マスターデータAPI実装
3. NGリストAPI実装

### Phase 3（2週間以内）
1. フォールバックデータの削除
2. CSVテンプレート動的生成
3. エラーハンドリングの改善

## 9. 環境設定

**現在のモックサーバー**: `https://saleslist-mock-api.onrender.com`
**本番API移行時の設定**: `NEXT_PUBLIC_API_BASE_URL`環境変数で切り替え可能

## 10. 注意事項

- フロントエンドは全てのAPIエンドポイントに対応済み
- モックデータは開発用のフォールバック処理
- 実際のAPIが実装されれば自動的に正しいデータを表示
- エラーハンドリングは適切に実装済み
