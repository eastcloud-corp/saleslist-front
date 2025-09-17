import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page with development credentials', async ({ page }) => {
    // ログインページへアクセス
    await page.goto('/login');

    // 開発環境バッジの確認
    await expect(page.locator('span:has-text("開発環境")').first()).toBeVisible();

    // デバッグ情報の確認
    await expect(page.locator('text=test@dev.com')).toBeVisible();
    await expect(page.locator('text=dev123')).toBeVisible();

    // 自動入力ボタンの確認
    const autoFillButton = page.locator('button:has-text("デバッグ情報を自動入力")');
    await expect(autoFillButton).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // 自動入力ボタンをクリック
    await page.click('button:has-text("デバッグ情報を自動入力")');

    // フォームに値が入力されたことを確認
    await expect(page.locator('input[type="email"]')).toHaveValue('test@dev.com');
    await expect(page.locator('input[type="password"]')).toHaveValue('dev123');

    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")');

    // ログイン後のページへのリダイレクトを待つ（企業一覧へ遷移する場合もある）
    await page.waitForURL(url => url.pathname !== '/login', { timeout: 5000 });

    // ログイン成功を確認（ダッシュボードまたは企業一覧）
    await expect(page).toHaveURL(/\/(dashboard|companies)/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // 無効な認証情報を入力
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // ログイン試行
    await page.click('button:has-text("ログイン")');

    // エラーメッセージを確認
    await expect(page.locator('text=/メールアドレスまたはパスワードが正しくありません|認証に失敗しました|Invalid credentials/')).toBeVisible({
      timeout: 5000
    });
  });
});