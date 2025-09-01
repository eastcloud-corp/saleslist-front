/**
 * リファレンスエラー専用テスト
 * 未定義変数、存在しないプロパティアクセスを検出
 */

const { test, expect } = require('@playwright/test');

test.describe('リファレンスエラーチェック', () => {

  test('変数・関数の未定義エラーを検出', async ({ page }) => {
    const referenceErrors = [];
    
    page.on('pageerror', error => {
      // リファレンスエラーの詳細分類
      if (error.message.includes('is not defined')) {
        const match = error.message.match(/(\w+) is not defined/);
        referenceErrors.push({
          type: 'UndefinedVariable',
          variable: match ? match[1] : 'unknown',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack)
        });
      }
    });

    // ログイン後、全主要ページをテスト
    await loginAndNavigate(page);
    
    const pages = [
      { url: '/', name: 'ダッシュボード' },
      { url: '/clients', name: 'クライアント一覧' },
      { url: '/companies', name: '企業一覧' },
      { url: '/projects', name: 'プロジェクト一覧' }
    ];

    for (const { url, name } of pages) {
      await page.goto(url);
      await page.waitForTimeout(2000);
      console.log(`✅ ${name} ページチェック完了`);
    }

    // 未定義変数エラーがないことを確認
    expect(referenceErrors).toHaveLength(0);
    
    if (referenceErrors.length > 0) {
      console.log('🚨 検出された未定義変数:', referenceErrors);
    }
  });

  test('プロパティアクセスエラーを検出', async ({ page }) => {
    const propertyErrors = [];
    
    page.on('pageerror', error => {
      // プロパティアクセスエラーの詳細分析
      if (error.message.includes('Cannot read properties of undefined') ||
          error.message.includes('Cannot read properties of null')) {
        
        const propertyMatch = error.message.match(/reading '(\w+)'/);
        const objectMatch = error.message.match(/of (undefined|null)/);
        
        propertyErrors.push({
          type: 'PropertyAccess',
          property: propertyMatch ? propertyMatch[1] : 'unknown',
          object: objectMatch ? objectMatch[1] : 'unknown',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack),
          line: extractLineNumber(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // 特にデータ処理が多いページをテスト
    const dataPages = [
      '/companies',
      '/clients', 
      '/projects',
      '/clients/1',    // 詳細ページ
      '/companies/1',  // 詳細ページ
      '/projects/1'    // 詳細ページ
    ];

    for (const url of dataPages) {
      await page.goto(url);
      await page.waitForTimeout(3000); // データ読み込み完了を待機
    }

    // プロパティアクセスエラーがないことを確認
    expect(propertyErrors).toHaveLength(0);
    
    if (propertyErrors.length > 0) {
      console.log('🚨 検出されたプロパティアクセスエラー:', propertyErrors);
    }
  });

  test('APIレスポンス関連のエラーを検出', async ({ page }) => {
    const apiErrors = [];
    
    page.on('pageerror', error => {
      // API関連エラーの検出
      if (error.message.includes('Cannot read properties') && 
          (error.stack?.includes('use-') || error.stack?.includes('api-'))) {
        apiErrors.push({
          type: 'APIResponseError',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack),
          line: extractLineNumber(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // API呼び出しが多いページでテスト
    await page.goto('/companies');
    await page.waitForTimeout(4000); // API完了まで待機

    // 検索フィルタでAPI呼び出しをトリガー
    await page.fill('input[placeholder*="検索"]', 'テスト');
    await page.waitForTimeout(2000);

    // APIレスポンス関連エラーがないことを確認
    expect(apiErrors).toHaveLength(0);
    
    if (apiErrors.length > 0) {
      console.log('🚨 検出されたAPIエラー:', apiErrors);
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

function extractLineNumber(stack) {
  if (!stack) return 'unknown';
  const match = stack.match(/:(\d+):/);
  return match ? match[1] : 'unknown';
}