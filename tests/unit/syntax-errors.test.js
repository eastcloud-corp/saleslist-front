/**
 * 構文エラー専用テスト
 * TypeScript/JavaScript構文問題を検出
 */

const { test, expect } = require('@playwright/test');

test.describe('構文エラーチェック', () => {

  test('TypeScript型エラーがランタイムエラーを引き起こしていない', async ({ page }) => {
    const typeErrors = [];
    
    page.on('pageerror', error => {
      // TypeScript関連のランタイムエラー
      if (error.message.includes('TypeError') ||
          error.message.includes('is not a function') ||
          error.message.includes('has no properties')) {
        typeErrors.push({
          type: 'TypeScriptRuntime',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // 全コンポーネントをテスト
    const routes = [
      '/',
      '/clients',
      '/clients/new',
      '/companies', 
      '/companies/new',
      '/projects',
      '/projects/new'
    ];

    for (const route of routes) {
      try {
        await page.goto(route);
        await page.waitForTimeout(1500);
        console.log(`✅ ${route} - 構文チェック完了`);
      } catch (e) {
        console.log(`⚠️ ${route} - ナビゲーションエラー: ${e.message}`);
      }
    }

    // TypeScriptランタイムエラーがないことを確認
    expect(typeErrors).toHaveLength(0);
    
    if (typeErrors.length > 0) {
      console.log('🚨 検出されたTypeScriptランタイムエラー:', typeErrors);
    }
  });

  test('JSXレンダリングエラーを検出', async ({ page }) => {
    const renderErrors = [];
    
    page.on('pageerror', error => {
      // JSXレンダリング関連エラー
      if (error.message.includes('React') ||
          error.message.includes('jsx') ||
          error.message.includes('Cannot read properties of undefined') ||
          error.message.includes('Objects are not valid as a React child')) {
        renderErrors.push({
          type: 'JSXRender',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // インタラクティブな操作でレンダリングエラーをテスト
    await page.goto('/companies');
    
    // 検索操作
    const searchInput = page.locator('input[placeholder*="検索"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('テスト企業');
      await page.waitForTimeout(1000);
    }

    // フィルタ操作
    const industrySelect = page.locator('select[name="industry"]');
    if (await industrySelect.count() > 0) {
      await industrySelect.selectOption('IT・ソフトウェア');
      await page.waitForTimeout(1000);
    }

    // JSXレンダリングエラーがないことを確認
    expect(renderErrors).toHaveLength(0);
    
    if (renderErrors.length > 0) {
      console.log('🚨 検出されたJSXレンダリングエラー:', renderErrors);
    }
  });

  test('非同期処理エラーを検出', async ({ page }) => {
    const asyncErrors = [];
    
    page.on('pageerror', error => {
      // 非同期処理関連エラー
      if (error.message.includes('Promise') ||
          error.message.includes('async') ||
          error.message.includes('await') ||
          error.message.includes('then is not a function')) {
        asyncErrors.push({
          type: 'AsyncError',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // 非同期処理が多い操作をテスト
    await page.goto('/companies/new');
    
    // フォーム送信（非同期処理）
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('テスト企業株式会社');
      
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000); // API完了を待機
      }
    }

    // 非同期エラーがないことを確認
    expect(asyncErrors).toHaveLength(0);
    
    if (asyncErrors.length > 0) {
      console.log('🚨 検出された非同期エラー:', asyncErrors);
    }
  });

});

// ヘルパー関数
async function loginAndNavigate(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

function extractComponentName(stack) {
  if (!stack) return 'unknown';
  const match = stack.match(/\/([^\/]+\.tsx?)/);
  return match ? match[1] : 'unknown';
}