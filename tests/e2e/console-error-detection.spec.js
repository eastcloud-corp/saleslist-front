// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * コンソールエラー検出E2Eテスト
 * 全ページでJavaScriptエラー・警告・ネットワークエラーを監視
 */

let consoleErrors = [];
let networkErrors = [];
let consoleWarnings = [];

test.describe('Console Error Detection', () => {
  
  test.beforeEach(async ({ page }) => {
    // エラー配列をリセット
    consoleErrors = [];
    networkErrors = [];
    consoleWarnings = [];
    
    // コンソールエラー監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
        console.log(`⚠️  Console Warning: ${msg.text()}`);
      }
    });
    
    // ネットワークエラー監視
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
      }
    });
    
    // JavaScript例外監視
    page.on('pageerror', error => {
      consoleErrors.push({
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(`💥 Page Error: ${error.message}`);
    });
  });

  test('Dashboard - Console Error Detection', async ({ page }) => {
    await page.goto('http://localhost:3007/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // エラー検証
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Projects List - Console Error Detection', async ({ page }) => {
    await page.goto('http://localhost:3007/projects');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // プロジェクト一覧が表示されるまで待機
    try {
      await page.waitForSelector('[data-testid="projects-table"], .border.rounded-md', { timeout: 10000 });
    } catch (e) {
      console.log('Projects table not found, continuing...');
    }
    
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Companies List - Console Error Detection', async ({ page }) => {
    await page.goto('http://localhost:3007/companies');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Login Page - Console Error Detection', async ({ page }) => {
    await page.goto('http://localhost:3007/login');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Project Detail - Console Error Detection', async ({ page }) => {
    // まずプロジェクト一覧でIDを取得
    await page.goto('http://localhost:3007/projects');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // 最初のプロジェクトリンクを探してクリック
    try {
      const projectLink = await page.locator('a[href^="/projects/"]:not([href="/projects"])').first();
      if (await projectLink.count() > 0) {
        await projectLink.click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } else {
        // プロジェクト詳細を直接アクセス（プロジェクトID 6を仮定）
        await page.goto('http://localhost:3007/projects/6');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      }
    } catch (e) {
      console.log('Project detail navigation failed, continuing...');
    }
    
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Add Companies Page - Console Error Detection', async ({ page }) => {
    await page.goto('http://localhost:3007/projects/6/add-companies');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Company Detail - Console Error Detection', async ({ page }) => {
    await page.goto('http://localhost:3007/companies/2');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    expect(consoleErrors.length, `Console errors found: ${JSON.stringify(consoleErrors, null, 2)}`).toBe(0);
    expect(networkErrors.filter(e => e.status >= 500).length, `Server errors found: ${JSON.stringify(networkErrors, null, 2)}`).toBe(0);
  });

  test('Navigation Test - Console Error Detection', async ({ page }) => {
    // ナビゲーション全体のテスト
    const pages = [
      'http://localhost:3007/dashboard',
      'http://localhost:3007/projects',
      'http://localhost:3007/companies',
      'http://localhost:3007/clients',
      'http://localhost:3007/login'
    ];
    
    for (const pageUrl of pages) {
      console.log(`Testing navigation to: ${pageUrl}`);
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // ページごとにエラーをチェック
      const pageErrors = consoleErrors.filter(e => e.timestamp > new Date(Date.now() - 5000).toISOString());
      const pageNetworkErrors = networkErrors.filter(e => e.timestamp > new Date(Date.now() - 5000).toISOString() && e.status >= 500);
      
      expect(pageErrors.length, `Console errors on ${pageUrl}: ${JSON.stringify(pageErrors, null, 2)}`).toBe(0);
      expect(pageNetworkErrors.length, `Network errors on ${pageUrl}: ${JSON.stringify(pageNetworkErrors, null, 2)}`).toBe(0);
    }
  });

  test.afterEach(async ({ page }) => {
    // テスト終了後のサマリー
    console.log('🔍 Test Summary:');
    console.log(`  Console Errors: ${consoleErrors.length}`);
    console.log(`  Network Errors (5xx): ${networkErrors.filter(e => e.status >= 500).length}`);
    console.log(`  Console Warnings: ${consoleWarnings.length}`);
    
    if (consoleWarnings.length > 0) {
      console.log('⚠️  Warnings (informational):');
      consoleWarnings.forEach(warning => {
        console.log(`    - ${warning.text}`);
      });
    }
    
    // 404エラーは許可（期待される動作）
    const clientErrors = networkErrors.filter(e => e.status >= 400 && e.status < 500);
    if (clientErrors.length > 0) {
      console.log('ℹ️  Client Errors (4xx - may be expected):');
      clientErrors.forEach(error => {
        console.log(`    - ${error.status} ${error.url}`);
      });
    }
  });
});