# APIクライアント422エラー修正案

## 問題
`/clients/`エンドポイントで422エラーが発生しています。

### エラー詳細
\`\`\`
GET https://saleslist-mock-api.onrender.com/clients/?page=1&page_size=100&industry=all
→ 422 Unprocessable Entity
\`\`\`

## 原因
1. URLに不要なトレイリングスラッシュ（`/clients/`）が含まれている
2. `Accept: application/json`ヘッダーとトレイリングスラッシュの組み合わせでPrismが誤動作

## 修正方法

### Option 1: URLからトレイリングスラッシュを削除
\`\`\`typescript
// ❌ 間違い
const url = `${API_URL}/clients/?page=1&page_size=100`

// ✅ 正しい
const url = `${API_URL}/clients?page=1&page_size=100`
\`\`\`

### Option 2: APIクライアントの修正
\`\`\`typescript
class ApiClient {
  private buildUrl(path: string, params?: Record<string, any>): string {
    // パスの末尾のスラッシュを削除
    const cleanPath = path.replace(/\/$/, '')
    
    // クエリパラメータの構築
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : ''
    
    return `${this.baseURL}${cleanPath}${queryString}`
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(path, params)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        // Accept ヘッダーは必要に応じて追加
        // 'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
}
\`\`\`

### Option 3: fetchClients関数の修正
\`\`\`typescript
export async function fetchClients(params: {
  page?: number
  pageSize?: number
  industry?: string
  search?: string
}) {
  // industryが'all'の場合は除外
  const queryParams: any = {
    page: params.page || 1,
    page_size: params.pageSize || 100,
  }
  
  if (params.industry && params.industry !== 'all') {
    queryParams.industry = params.industry
  }
  
  if (params.search) {
    queryParams.search = params.search
  }
  
  // トレイリングスラッシュなしでリクエスト
  return apiClient.get('/clients', queryParams)
}
\`\`\`

## テスト用コード
\`\`\`typescript
// 動作確認
const testApi = async () => {
  try {
    // トレイリングスラッシュなし
    const response = await fetch('https://saleslist-mock-api.onrender.com/clients?page=1&page_size=100', {
      headers: {
        'Authorization': 'Bearer test_token'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Success:', data)
    } else {
      console.error('Error:', response.status)
    }
  } catch (error) {
    console.error('Failed:', error)
  }
}
\`\`\`

## 推奨される修正
1. APIクライアントでトレイリングスラッシュを自動削除
2. `industry=all`の場合はパラメータから除外
3. 不要な`Accept`ヘッダーは送信しない（または適切に設定）
