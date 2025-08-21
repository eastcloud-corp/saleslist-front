# 画面とAPI対応表

営業リスト管理システムの各画面で使用するAPIエンドポイントの詳細対応表です。

## 基本情報

- **モックAPI URL**: https://saleslist-mock-api.onrender.com
- **認証方式**: Bearer Token (JWT)
- **データ形式**: JSON

---

## 1. ログイン画面 (`/login`)

### 画面概要
- ユーザー認証を行う画面
- メールアドレス・パスワード入力フォーム

### 使用API

| 操作 | HTTP メソッド | エンドポイント | 説明 | リクエスト例 |
|------|---------------|---------------|------|-------------|
| ログイン | POST | `/auth/login` | ユーザー認証 | `{"email": "user@example.com", "password": "password123"}` |

### APIレスポンス例
\`\`\`json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "山田太郎"
  }
}
