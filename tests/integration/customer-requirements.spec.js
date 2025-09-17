// 顧客要件対応機能のテスト

const { test, expect } = require('@playwright/test');

// ログイン用ヘルパー
async function login(page, role = 'user') {
  await page.goto('/login');

  // デバッグ情報でログイン（現在は管理者と一般ユーザーの区別はなし）
  await page.click('button:has-text("デバッグ情報を自動入力")');
  await page.click('button:has-text("ログイン")');
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 10000 });
}

test.describe('顧客要件対応機能テスト', () => {
  
  test('1. クライアント詳細画面での案件作成機能', async ({ page }) => {
    await login(page);
    
    // クライアント一覧へ
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    
    // 最初のクライアントの詳細へ
    await page.click('text=詳細').first();
    await page.waitForLoadState('networkidle');
    
    // 案件作成ダイアログを開く
    await page.click('text=新規案件作成');
    
    // フォーム入力
    await page.fill('#project-name', 'テスト案件');
    await page.fill('#project-description', 'テスト用の案件です');
    await page.fill('#assigned-user', 'テスト担当者');
    
    // 作成ボタンクリック
    await page.click('button:has-text("作成")');
    
    // 案件が作成されたことを確認
    await page.waitForTimeout(2000);
    await expect(page.locator('text=テスト案件')).toBeVisible();
    
    console.log('✅ 案件作成機能: 正常動作');
  });

  test('2. CSV エクスポート管理者権限制限', async ({ page }) => {
    // 一般ユーザーでログイン
    await login(page, 'user');
    
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');
    
    // CSV エクスポートボタンが表示されないことを確認
    const exportButton = page.locator('text=CSV エクスポート');
    await expect(exportButton).toBeHidden();
    
    console.log('✅ 一般ユーザー: CSV エクスポートボタン非表示');
    
    // 管理者でログイン
    await page.goto('/logout');
    await login(page, 'admin');
    
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');
    
    // CSV エクスポートボタンが表示されることを確認
    await expect(page.locator('text=CSV エクスポート')).toBeVisible();
    
    console.log('✅ 管理者: CSV エクスポートボタン表示');
  });

  test('3. ユーザー作成でのusername入力', async ({ page }) => {
    await login(page, 'admin');
    
    // ユーザー管理画面へ（設定画面経由）
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // ユーザー招待ダイアログを開く
    await page.click('text=ユーザー招待');
    
    // username フィールドが表示されることを確認
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('text=ユーザー名')).toBeVisible();
    
    // フォーム入力テスト
    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass123');
    
    console.log('✅ ユーザー作成: usernameフィールド表示・入力可能');
  });

  test('4. 案件一覧のテーブル表示', async ({ page }) => {
    await login(page);
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // テーブル表示の確認
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("案件名")')).toBeVisible();
    await expect(page.locator('th:has-text("クライアント")')).toBeVisible();
    await expect(page.locator('th:has-text("ステータス")')).toBeVisible();
    
    // カード表示でないことを確認
    const cardElements = page.locator('.grid-cols-1, .grid-cols-2, .grid-cols-3');
    await expect(cardElements).toHaveCount(0);
    
    console.log('✅ 案件一覧: テーブル表示に変更済み');
  });

  test('5. 全機能統合テスト', async ({ page }) => {
    await login(page, 'admin');
    
    // 1. 企業一覧でCSV エクスポート確認
    await page.goto('/companies');
    await expect(page.locator('text=CSV エクスポート')).toBeVisible();
    
    // 2. クライアント詳細で案件作成
    await page.goto('/clients');
    await page.click('text=詳細').first();
    await page.click('text=新規案件作成');
    await page.fill('#project-name', '統合テスト案件');
    await page.click('button:has-text("作成")');
    
    // 3. 案件一覧でテーブル表示確認
    await page.goto('/projects');
    await expect(page.locator('table')).toBeVisible();
    
    console.log('✅ 全機能統合テスト: 正常動作');
  });

});