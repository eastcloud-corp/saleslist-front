/**
 * JavaScript実行エラー専用テスト
 * ランタイムエラー、型エラー、実行時例外を検出
 */

const { test, expect } = require('@playwright/test');

test.describe('JavaScript実行エラーチェック', () => {

  test('DOM操作エラーを検出', async ({ page }) => {
    const domErrors = [];
    
    page.on('pageerror', error => {
      // DOM操作関連エラー
      if (error.message.includes('querySelector') ||
          error.message.includes('addEventListener') ||
          error.message.includes('appendChild') ||
          error.message.includes('removeChild') ||
          error.message.includes('Element') ||
          error.message.includes('Node')) {
        domErrors.push({
          type: 'DOMError',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // DOM操作が多いページをテスト
    await page.goto('/companies');
    
    // チェックボックス操作
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(200);
    }

    // DOM操作エラーがないことを確認
    expect(domErrors).toHaveLength(0);
    
    if (domErrors.length > 0) {
      console.log('🚨 検出されたDOM操作エラー:', domErrors);
    }
  });

  test('イベントハンドラーエラーを検出', async ({ page }) => {
    const eventErrors = [];
    
    page.on('pageerror', error => {
      // イベントハンドラー関連エラー
      if (error.stack?.includes('onClick') ||
          error.stack?.includes('onChange') ||
          error.stack?.includes('onSubmit') ||
          error.stack?.includes('handleClick') ||
          error.stack?.includes('handleSubmit')) {
        eventErrors.push({
          type: 'EventHandler',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack),
          handler: extractEventHandler(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // 各種ボタン・フォーム操作をテスト
    const testActions = [
      { page: '/companies', action: 'search', selector: 'input[placeholder*="検索"]' },
      { page: '/clients', action: 'filter', selector: 'select[name="industry"]' },
      { page: '/companies/new', action: 'form', selector: 'button[type="submit"]' }
    ];

    for (const { page: pageUrl, action, selector } of testActions) {
      await page.goto(pageUrl);
      await page.waitForTimeout(2000);
      
      const element = page.locator(selector);
      if (await element.count() > 0) {
        try {
          if (action === 'search') {
            await element.fill('テスト');
          } else if (action === 'filter') {
            await element.selectOption({ index: 1 });
          } else if (action === 'form') {
            await element.click();
          }
          await page.waitForTimeout(1000);
          console.log(`✅ ${pageUrl} - ${action} 操作完了`);
        } catch (e) {
          console.log(`⚠️ ${pageUrl} - ${action} 操作スキップ`);
        }
      }
    }

    // イベントハンドラーエラーがないことを確認
    expect(eventErrors).toHaveLength(0);
    
    if (eventErrors.length > 0) {
      console.log('🚨 検出されたイベントハンドラーエラー:', eventErrors);
    }
  });

  test('型変換・キャストエラーを検出', async ({ page }) => {
    const castErrors = [];
    
    page.on('pageerror', error => {
      // 型変換関連エラー
      if (error.message.includes('parseInt') ||
          error.message.includes('parseFloat') ||
          error.message.includes('Number') ||
          error.message.includes('String') ||
          error.message.includes('toString') ||
          error.message.includes('Invalid Date') ||
          error.message.includes('NaN')) {
        castErrors.push({
          type: 'TypeCast',
          message: error.message,
          stack: error.stack,
          component: extractComponentName(error.stack)
        });
      }
    });

    await loginAndNavigate(page);

    // 数値・日付処理が多いページをテスト
    await page.goto('/companies');
    await page.waitForTimeout(2000);

    // フィルタで数値入力
    const employeeMin = page.locator('input[name="employee_min"]');
    if (await employeeMin.count() > 0) {
      await employeeMin.fill('abc'); // 意図的に無効な値
      await page.waitForTimeout(1000);
      await employeeMin.fill('100'); // 正常な値
      await page.waitForTimeout(1000);
    }

    // 型変換エラーがないことを確認
    expect(castErrors).toHaveLength(0);
    
    if (castErrors.length > 0) {
      console.log('🚨 検出された型変換エラー:', castErrors);
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

function extractEventHandler(stack) {
  if (!stack) return 'unknown';
  const match = stack.match(/(onClick|onChange|onSubmit|handle\w+)/);
  return match ? match[1] : 'unknown';
}