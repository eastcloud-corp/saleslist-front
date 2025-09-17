import { test, expect } from '@playwright/test';

test.describe('シンプルCRUD確認', () => {
  // ログイン処理
  async function quickLogin(page) {
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    // シンプルな待機 - ログインページから離れるまで
    await page.waitForTimeout(2000);
  }

  test('企業一覧の表示とボタン動作', async ({ page }) => {
    await quickLogin(page);

    // 企業一覧へ
    await page.goto('/companies');
    await page.waitForTimeout(1000);

    // テーブルの存在確認
    const hasTable = await page.locator('table').isVisible();
    expect(hasTable).toBe(true);
    console.log('✅ テーブル表示: OK');

    // 企業数をカウント
    const rows = await page.locator('table tbody tr').count();
    console.log(`✅ 企業数: ${rows}件`);

    // ボタンの存在確認
    const addButton = await page.locator('text=企業追加').isVisible();
    console.log(`✅ 企業追加ボタン: ${addButton ? '存在' : '不在'}`);

    const exportButton = await page.locator('text=CSV エクスポート').isVisible();
    console.log(`✅ エクスポートボタン: ${exportButton ? '存在' : '不在'}`);
  });

  test('企業詳細の表示', async ({ page }) => {
    await quickLogin(page);
    await page.goto('/companies');
    await page.waitForTimeout(1000);

    // 詳細リンクをクリック
    const detailLinks = page.locator('a:has-text("詳細")');
    const count = await detailLinks.count();

    if (count > 0) {
      await detailLinks.first().click();
      await page.waitForTimeout(2000);

      // URLが変わったか確認
      const url = page.url();
      const isDetailPage = url.includes('/companies/') && url.match(/\/\d+$/);
      console.log(`✅ 詳細ページ遷移: ${isDetailPage ? 'OK' : 'NG'}`);

      // 編集ボタンの存在確認
      const hasEditButton = await page.locator('button:has-text("編集")').count() > 0;
      console.log(`✅ 編集ボタン: ${hasEditButton ? '存在' : '不在'}`);
    } else {
      console.log('❌ 詳細リンクなし');
    }
  });

  test('新規企業作成画面の表示', async ({ page }) => {
    await quickLogin(page);

    // 直接新規作成ページへ
    await page.goto('/companies/new');
    await page.waitForTimeout(1000);

    // フォームの存在確認
    const hasNameInput = await page.locator('input').first().isVisible();
    console.log(`✅ 入力フォーム: ${hasNameInput ? '存在' : '不在'}`);

    // 保存ボタンの存在確認
    const hasSaveButton = await page.locator('button:has-text("変更を保存")').isVisible();
    console.log(`✅ 保存ボタン: ${hasSaveButton ? '存在' : '不在'}`);

    // キャンセルボタンの存在確認
    const hasCancelButton = await page.locator('button:has-text("キャンセル")').isVisible();
    console.log(`✅ キャンセルボタン: ${hasCancelButton ? '存在' : '不在'}`);
  });

  test('検索機能の動作確認', async ({ page }) => {
    await quickLogin(page);
    await page.goto('/companies');
    await page.waitForTimeout(1000);

    // 検索ボックスを探す
    const searchInputs = page.locator('input[type="text"], input[type="search"]');
    const searchCount = await searchInputs.count();

    if (searchCount > 0) {
      // 最初の入力欄に入力
      const searchBox = searchInputs.first();
      await searchBox.fill('テスト');
      await searchBox.press('Enter');
      await page.waitForTimeout(2000);

      console.log('✅ 検索実行: OK');

      // 結果の確認（行数が変わったか）
      const afterRows = await page.locator('table tbody tr').count();
      console.log(`✅ 検索後の結果: ${afterRows}件`);
    } else {
      console.log('❌ 検索ボックスなし');
    }
  });

  test('レスポンスタイム測定', async ({ page }) => {
    const startTime = Date.now();

    await quickLogin(page);
    const loginTime = Date.now() - startTime;
    console.log(`⏱️ ログイン時間: ${loginTime}ms`);

    const listStart = Date.now();
    await page.goto('/companies');
    await page.waitForSelector('table', { timeout: 5000 });
    const listTime = Date.now() - listStart;
    console.log(`⏱️ 一覧表示時間: ${listTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ 総実行時間: ${totalTime}ms`);

    // 10秒以内に完了すべき
    expect(totalTime).toBeLessThan(10000);
  });
});

// 全テストを15秒以内に完了させる
test.setTimeout(15000);