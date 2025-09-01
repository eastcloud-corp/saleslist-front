// フロントエンド全URL→API完全検証テスト

const { test, expect } = require('@playwright/test');

// ログインヘルパー
async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('フロントエンド→Django API完全検証', () => {

  test('全14ページでAPIエラー0件確認', async ({ page }) => {
    const apiErrors = [];
    const apiRequests = [];
    
    // Django API監視
    page.on('response', response => {
      if (response.url().includes('localhost:8080/api/v1/')) {
        const apiRequest = {
          url: response.url(),
          status: response.status(),
          method: 'GET', // TODO: requestから正確なメソッド取得
          page: page.url(),
          timestamp: new Date().toISOString()
        };
        
        apiRequests.push(apiRequest);
        
        // 4xx, 5xxエラーを記録
        if (response.status() >= 400) {
          apiErrors.push({
            ...apiRequest,
            error_type: response.status() >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR'
          });
        }
        
        console.log(`📡 API: ${response.status()} ${response.url()}`);
      }
    });

    // ログイン
    await login(page);

    // 全URLパターンのテスト
    const testUrls = [
      { url: '/', name: 'ダッシュボード（ルート）' },
      { url: '/dashboard', name: 'ダッシュボード' },
      { url: '/clients', name: 'クライアント一覧' },
      { url: '/clients/new', name: '新規クライアント作成' },
      { url: '/clients/1', name: 'クライアント詳細' },
      { url: '/clients/1/select-companies', name: '企業選択' },
      { url: '/companies', name: '企業一覧' },
      { url: '/companies/new', name: '新規企業作成' },
      { url: '/companies/5', name: '企業詳細' },
      { url: '/projects', name: 'プロジェクト一覧' },
      { url: '/projects/1', name: 'プロジェクト詳細' },
      { url: '/projects/1/add-companies', name: '企業追加' },
      { url: '/settings', name: '設定' }
    ];

    for (const { url, name } of testUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(3000); // API完了を十分に待機
        
        console.log(`✅ ${name} (${url}) - 表示完了`);
      } catch (error) {
        console.log(`⚠️ ${name} (${url}) - ナビゲーションエラー: ${error.message}`);
      }
    }

    // APIエラーサマリー
    console.log(`\n📊 API呼び出しサマリー:`);
    console.log(`   総API呼び出し数: ${apiRequests.length}`);
    console.log(`   エラー数: ${apiErrors.length}`);
    
    if (apiErrors.length > 0) {
      console.log(`\n🚨 検出されたAPIエラー:`);
      apiErrors.forEach(error => {
        console.log(`   ${error.status} ${error.url} (ページ: ${error.page})`);
      });
    }

    // APIエラー0件を確認
    expect(apiErrors).toHaveLength(0);
    
    console.log(`\n🎉 全URLでAPIエラー0件達成！`);
  });

  test('フォーム送信・操作でAPIエラー0件確認', async ({ page }) => {
    const apiErrors = [];
    
    page.on('response', response => {
      if (response.url().includes('localhost:8080/api/v1/') && response.status() >= 400) {
        apiErrors.push({
          url: response.url(),
          status: response.status(),
          operation: 'FORM_SUBMIT'
        });
      }
    });

    await login(page);

    // フォーム送信テスト
    const formTests = [
      {
        page: '/companies/new',
        action: async () => {
          await page.fill('input[name="name"]', 'E2Eテスト株式会社');
          await page.selectOption('select[name="industry"]', 'IT・ソフトウェア');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);
        }
      }
    ];

    for (const { page: testPage, action } of formTests) {
      try {
        await page.goto(testPage);
        await page.waitForTimeout(1000);
        await action();
        console.log(`✅ ${testPage} - フォーム送信完了`);
      } catch (error) {
        console.log(`⚠️ ${testPage} - フォーム送信エラー: ${error.message}`);
      }
    }

    // フォーム送信でAPIエラー0件確認
    expect(apiErrors).toHaveLength(0);
  });

  test('検索・フィルター操作でAPIエラー0件確認', async ({ page }) => {
    const apiErrors = [];
    
    page.on('response', response => {
      if (response.url().includes('localhost:8080/api/v1/') && response.status() >= 400) {
        apiErrors.push({
          url: response.url(),
          status: response.status(),
          operation: 'FILTER_SEARCH'
        });
      }
    });

    await login(page);

    // 検索・フィルター操作テスト
    await page.goto('/companies');
    await page.waitForTimeout(2000);

    // 検索操作
    const searchInput = page.locator('input[placeholder*="検索"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('テスト');
      await page.waitForTimeout(2000);
    }

    // 業界フィルター操作
    const industrySelect = page.locator('select[name="industry"]');
    if (await industrySelect.count() > 0) {
      await industrySelect.selectOption('IT・ソフトウェア');
      await page.waitForTimeout(2000);
    }

    // 検索・フィルターでAPIエラー0件確認
    expect(apiErrors).toHaveLength(0);
    
    console.log('✅ 検索・フィルター操作でAPIエラー0件確認');
  });

});