# フロントエンド→API完全マッピング（実装調査結果）

## 📊 調査対象：14ページ

### **✅ API完全接続済みページ**

#### **1. ログイン** (`/login`)
- **Hook**: `use-auth.tsx`
- **API**: `POST /auth/login`, `GET /auth/me`
- **状態**: ✅ 完全動作

#### **2. クライアント一覧** (`/clients`)
- **Hook**: `use-clients.tsx`
- **API**: `GET /clients/?page=1&page_size=100`
- **フィルター**: `industry`, `search`, `is_active`
- **状態**: ✅ 完全動作

#### **3. クライアント詳細** (`/clients/[id]`)
- **Hook**: `use-clients.tsx`
- **API**: 
  - `GET /clients/{id}` (詳細)
  - `GET /clients/{id}/stats` (統計)
  - `GET /clients/{id}/ng-companies` (NGリスト)
- **状態**: ✅ 完全動作

#### **4. 企業選択** (`/clients/[id]/select-companies`)
- **Hook**: `use-companies.tsx`, `use-clients.tsx`
- **API**: 
  - `GET /clients/{id}` (クライアント情報)
  - `GET /companies/?page=1&page_size=100` (企業一覧)
- **状態**: ✅ 完全動作

#### **5. 企業一覧** (`/companies`)
- **Hook**: `use-companies.tsx`
- **API**: `GET /companies/?page=1&page_size=100`
- **フィルター**: `search`, `industry`, `employee_min/max`, `revenue_min/max`, `prefecture`, `has_facebook`, `exclude_ng`
- **状態**: ✅ 完全動作

#### **6. 企業詳細** (`/companies/[id]`)
- **Hook**: `use-company.tsx`
- **API**: `GET /companies/{id}`
- **状態**: ✅ 完全動作

#### **7. プロジェクト一覧** (`/projects`)
- **Hook**: `use-projects.tsx`
- **API**: `GET /projects/?page=1&limit=20`
- **状態**: ✅ 完全動作

#### **8. プロジェクト詳細** (`/projects/[id]`)
- **Hook**: `use-project.tsx`
- **API**: 
  - `GET /projects/{id}` (詳細)
  - `GET /projects/{id}/companies` (関連企業)
- **状態**: ✅ 完全動作

#### **9. 企業追加** (`/projects/[id]/add-companies`)
- **Hook**: `use-companies.tsx`, `use-project.tsx`
- **API**: 
  - `GET /projects/{id}/available-companies` (追加可能企業)
  - `POST /projects/{id}/add-companies` (企業追加)
- **状態**: ✅ 完全動作

### **❌ API未接続・未実装ページ**

#### **10. ダッシュボード** (`/` → `/dashboard`)
```typescript
// 現在の実装（モックデータ）
const stats = {
  totalCompanies: 25000,      // ← ハードコーディング
  activeProjects: 12,         // ← ハードコーディング
  prospectCompanies: 1250,    // ← ハードコーディング
  completedDeals: 45,         // ← ハードコーディング
}

// あるべき実装
const { stats } = useDashboard()  // GET /dashboard/stats
```
**状態**: ❌ **API未接続**

#### **11. 新規クライアント作成** (`/clients/new`)
- **Hook**: 未使用
- **API**: フォーム送信時の`POST /clients`は実装されていない可能性
- **状態**: ⚠️ **要確認**

#### **12. 新規企業作成** (`/companies/new`)
```typescript
// 現在の実装
const handleSave = async (data: any) => {
  try {
    // TODO: Implement create company API call
    console.log("Creating company:", data)
    router.push("/companies")
  } catch (error) {
```
**状態**: ❌ **API未実装**

#### **13. プロジェクト削除** (`/projects/[id]`)
```typescript
// project-detail-client.tsx内
// TODO: Implement delete project API call
```
**状態**: ❌ **API未実装**

#### **14. 設定画面** (`/settings`)
- **Hook**: 確認中
- **API**: 不明
- **状態**: ⚠️ **要確認**

## 📋 緊急修正が必要な箇所

### **3個の重大な未実装**
1. **ダッシュボード統計API**: モックデータ → 実際のAPI
2. **企業作成API**: TODO → 実装
3. **プロジェクト削除API**: TODO → 実装

### **2個の要確認**
1. **クライアント作成**: フォーム送信実装確認
2. **設定画面**: API使用有無確認