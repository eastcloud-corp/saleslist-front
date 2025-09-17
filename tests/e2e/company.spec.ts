import { test, expect } from '@playwright/test';

test.describe('Company Management', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard');
  });

  test('should create new company and display in list', async ({ page }) => {
    // 企業一覧へ移動
    await page.goto('/companies');

    // 新規作成ボタンをクリック
    await page.click('a:has-text("新規企業")');
    await page.waitForURL('**/companies/new');

    // フォーム入力
    await page.fill('input[name="name"]', 'テスト株式会社');
    await page.selectOption('select[name="industry"]', 'IT・通信');
    await page.fill('input[name="employee_count"]', '100');
    await page.fill('input[name="website_url"]', 'https://test.example.com');
    await page.fill('input[name="contact_email"]', 'contact@test.example.com');
    await page.fill('input[name="phone_number"]', '03-1234-5678');

    // 作成ボタンをクリック
    await page.click('button:has-text("作成")');

    // 一覧ページへのリダイレクトを確認
    await page.waitForURL('**/companies');

    // 新規作成した企業が表示されることを確認
    await expect(page.locator('text=テスト株式会社')).toBeVisible({
      timeout: 5000
    });
  });

  test('should edit company information', async ({ page }) => {
    await page.goto('/companies');

    // 最初の企業をクリック
    const firstCompany = page.locator('.company-card').first();
    await firstCompany.click();

    // 編集ボタンをクリック
    await page.click('button:has-text("編集")');

    // 企業名を変更
    await page.fill('input[name="name"]', '更新済み株式会社');

    // 保存
    await page.click('button:has-text("保存")');

    // 更新確認
    await expect(page.locator('text=更新済み株式会社')).toBeVisible();
  });

  test('should filter companies by industry', async ({ page }) => {
    await page.goto('/companies');

    // 業界フィルターを選択
    await page.selectOption('select[name="industry-filter"]', 'IT・通信');

    // フィルター結果を確認
    const companies = page.locator('.company-card');
    const count = await companies.count();

    // 少なくとも1件は表示される
    expect(count).toBeGreaterThan(0);

    // すべての企業がIT・通信業界であることを確認
    for (let i = 0; i < count; i++) {
      await expect(companies.nth(i).locator('text=IT・通信')).toBeVisible();
    }
  });
});