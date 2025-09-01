/**
 * フロントエンドエラー検出テストスイート
 * リファレンスエラー、構文エラー、JSエラーをチェック
 */

const { test, expect } = require('@playwright/test');

test.describe('フロントエンドエラー検出テスト', () => {

  test.beforeEach(async ({ page }) => {
    // コンソールエラーを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });

    // JavaScriptエラーを監視
    page.on('pageerror', error => {
      console.log(`🚨 Page Error: ${error.message}`);
    });

    // ネットワークエラーを監視
    page.on('requestfailed', request => {
      console.log(`🚨 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('ログイン画面でJavaScriptエラーが発生しない', async ({ page }) => {
    const errors = [];
    
    page.on('pageerror', error => {
      errors.push({
        type: 'PageError',
        message: error.message,
        stack: error.stack
      });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          type: 'ConsoleError',
          message: msg.text()
        });
      }
    });

    await page.goto('/login');
    await page.waitForTimeout(2000); // ページ読み込み完了を待機

    // JavaScriptエラーがないことを確認
    expect(errors).toHaveLength(0);
    
    if (errors.length > 0) {
      console.log('🚨 検出されたエラー:', errors);
    }
  });

  test('企業一覧画面でリファレンスエラーが発生しない', async ({ page }) => {
    const referenceErrors = [];
    
    page.on('pageerror', error => {
      if (error.message.includes('is not defined') || 
          error.message.includes('Cannot read properties of undefined') ||
          error.message.includes('ReferenceError')) {
        referenceErrors.push({
          message: error.message,
          stack: error.stack,
          location: error.stack?.split('\n')[1]
        });
      }
    });

    // ログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 企業一覧に移動
    await page.goto('/companies');
    await page.waitForTimeout(3000); // API読み込み完了を待機

    // リファレンスエラーがないことを確認
    expect(referenceErrors).toHaveLength(0);
    
    if (referenceErrors.length > 0) {
      console.log('🚨 検出されたリファレンスエラー:', referenceErrors);
    }
  });

  test('クライアント一覧画面で構文エラーが発生しない', async ({ page }) => {
    const syntaxErrors = [];
    
    page.on('pageerror', error => {
      if (error.message.includes('SyntaxError') || 
          error.message.includes('Unexpected token') ||
          error.message.includes('Invalid regular expression')) {
        syntaxErrors.push({
          message: error.message,
          stack: error.stack
        });
      }
    });

    // ログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // クライアント一覧に移動
    await page.goto('/clients');
    await page.waitForTimeout(3000); // API読み込み完了を待機

    // 構文エラーがないことを確認
    expect(syntaxErrors).toHaveLength(0);
    
    if (syntaxErrors.length > 0) {
      console.log('🚨 検出された構文エラー:', syntaxErrors);
    }
  });

  test('プロジェクト一覧画面でTypeErrorが発生しない', async ({ page }) => {
    const typeErrors = [];
    
    page.on('pageerror', error => {
      if (error.message.includes('TypeError') || 
          error.message.includes('Cannot read properties') ||
          error.message.includes('is not a function')) {
        typeErrors.push({
          message: error.message,
          stack: error.stack,
          component: error.stack?.split('\n')[1]?.match(/\/([^\/]+\.tsx?)/)?.[1]
        });
      }
    });

    // ログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // プロジェクト一覧に移動
    await page.goto('/projects');
    await page.waitForTimeout(3000); // API読み込み完了を待機

    // TypeErrorがないことを確認
    expect(typeErrors).toHaveLength(0);
    
    if (typeErrors.length > 0) {
      console.log('🚨 検出されたTypeError:', typeErrors);
    }
  });

  test('全ページのコンソールエラーを包括チェック', async ({ page }) => {
    const allErrors = [];
    
    page.on('pageerror', error => {
      allErrors.push({
        type: 'PageError',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push({
          type: 'ConsoleError',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // ログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 主要ページを巡回
    const pages = ['/', '/clients', '/companies', '/projects'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForTimeout(2000);
    }

    // 全体的なエラー状況を確認
    const errorSummary = {
      total: allErrors.length,
      pageErrors: allErrors.filter(e => e.type === 'PageError').length,
      consoleErrors: allErrors.filter(e => e.type === 'ConsoleError').length
    };

    console.log('📊 エラーサマリー:', errorSummary);
    
    if (allErrors.length > 0) {
      console.log('🚨 検出された全エラー:', allErrors);
    }

    // 重大なエラーがないことを確認（警告は許可）
    const criticalErrors = allErrors.filter(error => 
      !error.message.includes('Warning') && 
      !error.message.includes('DevTools') &&
      !error.message.includes('favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });

});