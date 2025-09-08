#!/usr/bin/env node

// フロントエンド→バックエンドAPI統合テスト

const { chromium } = require('playwright');

async function runAPIIntegrationTest() {
  console.log('🧪 フロントエンド→バックエンドAPI統合テスト開始');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // API呼び出し監視
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('localhost:8006/api/')) {
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('localhost:8006/api/')) {
      console.log(`📡 API: ${response.request().method()} ${response.url()} → ${response.status()}`);
    }
  });

  try {
    // 1. ログインテスト
    console.log('🔐 ログインテスト...');
    await page.goto('http://localhost:3008/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. 企業一覧API呼び出しテスト
    console.log('📊 企業一覧API呼び出しテスト...');
    await page.goto('http://localhost:3008/companies');
    await page.waitForTimeout(3000);
    
    // 3. マスターデータAPI呼び出しテスト
    console.log('📋 マスターデータAPI呼び出しテスト...');
    await page.goto('http://localhost:3008/projects');
    await page.waitForTimeout(3000);
    
    // 4. クライアント詳細→案件作成テスト
    console.log('📝 案件作成APIテスト...');
    await page.goto('http://localhost:3008/clients');
    await page.waitForTimeout(2000);
    
    // クライアント詳細へ
    const detailButton = await page.locator('text=詳細').first();
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await page.waitForTimeout(2000);
      
      // 案件作成テスト
      await page.click('text=新規案件作成');
      await page.fill('#project-name', 'APIテスト案件');
      await page.fill('#project-description', 'API統合テスト用');
      await page.click('button:has-text("作成")');
      await page.waitForTimeout(3000);
    }

    // 結果集計
    console.log('\\n📈 API呼び出し統計:');
    console.log(`総API呼び出し数: ${apiCalls.length}`);
    
    const authCalls = apiCalls.filter(call => call.url.includes('/auth/'));
    const companyCalls = apiCalls.filter(call => call.url.includes('/companies'));
    const projectCalls = apiCalls.filter(call => call.url.includes('/projects'));
    const masterCalls = apiCalls.filter(call => call.url.includes('/master/'));
    
    console.log(`認証API: ${authCalls.length}回`);
    console.log(`企業API: ${companyCalls.length}回`);
    console.log(`案件API: ${projectCalls.length}回`);
    console.log(`マスターデータAPI: ${masterCalls.length}回`);
    
    // 認証ヘッダー確認
    const authenticatedCalls = apiCalls.filter(call => call.headers.authorization);
    console.log(`認証付きAPI呼び出し: ${authenticatedCalls.length}/${apiCalls.length}`);
    
    console.log('\\n✅ フロントエンド→バックエンドAPI統合テスト完了');
    
  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
  } finally {
    await browser.close();
  }
}

runAPIIntegrationTest();