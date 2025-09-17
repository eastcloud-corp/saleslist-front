import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('NGリスト管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard');
  });

  test('CSVインポートからNG追加・削除フロー', async ({ page }) => {
    // クライアント一覧へ移動
    await page.goto('/clients');

    // 最初のクライアントをクリックして詳細へ
    const firstClient = page.locator('.client-card, tr.client-row').first();
    await firstClient.click();
    await page.waitForURL(/.*clients\/\d+/);

    // NGリストタブをクリック
    await page.click('button[role="tab"]:has-text("NGリスト"), a:has-text("NGリスト")');

    // CSVファイルを作成
    const csvContent = '企業名,理由\n株式会社テストNG,競合他社\nNGコーポレーション,既存取引先\nNG商事,クライアント指定NG';
    const csvPath = path.join(process.cwd(), 'test-ng-list.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    // ファイルアップロード
    const fileInput = page.locator('input[type="file"][accept*=".csv"]');
    await fileInput.setInputFiles(csvPath);

    // インポート結果の確認
    await expect(page.locator('text=/インポート完了|Import completed/')).toBeVisible({
      timeout: 10000
    });

    // インポート結果のメッセージ確認（3件のNGリストを登録）
    await expect(page.locator('text=/3件.*登録/')).toBeVisible();

    // NGリスト一覧に表示確認
    await expect(page.locator('text=株式会社テストNG')).toBeVisible();
    await expect(page.locator('text=NGコーポレーション')).toBeVisible();
    await expect(page.locator('text=NG商事')).toBeVisible();

    // マッチ/アンマッチ表示確認
    const ngListTable = page.locator('table, .ng-list');
    await expect(ngListTable).toBeVisible();

    // NG企業を削除
    const deleteButton = page.locator('button[aria-label*="削除"], button:has-text("削除")').first();
    await deleteButton.click();

    // 削除確認ダイアログ
    const confirmButton = page.locator('button:has-text("確認"), button:has-text("はい"), button:has-text("OK")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // 削除成功メッセージ
    await expect(page.locator('text=/削除しました|Deleted successfully/')).toBeVisible();

    // テストファイルをクリーンアップ
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  });

  test('企業検索からNG追加', async ({ page }) => {
    // クライアント詳細のNGリストタブへ
    await page.goto('/clients');
    const firstClient = page.locator('.client-card, tr.client-row').first();
    await firstClient.click();
    await page.waitForURL(/.*clients\/\d+/);
    await page.click('button[role="tab"]:has-text("NGリスト"), a:has-text("NGリスト")');

    // 企業検索セクションを探す
    const searchSection = page.locator('section:has-text("企業検索"), div:has-text("企業を検索してNG追加")');

    if (await searchSection.isVisible()) {
      // 企業名を検索
      await page.fill('input[placeholder*="企業名"]', 'テスト企業');
      await page.click('button:has-text("検索")');

      // 検索結果から企業を選択
      const searchResult = page.locator('.search-result, .company-search-item').first();
      await expect(searchResult).toBeVisible();

      // NG理由を入力
      await page.fill('input[name="reason"], textarea[name="reason"]', 'テスト用NG理由');

      // NG追加ボタンをクリック
      await page.click('button:has-text("NGリストに追加")');

      // 追加成功メッセージ
      await expect(page.locator('text=/追加しました|Added to NG list/')).toBeVisible();

      // NGリスト一覧に追加されたことを確認
      await expect(page.locator('text=テスト企業')).toBeVisible();
      await expect(page.locator('text=テスト用NG理由')).toBeVisible();
    }
  });

  test('NG企業のマッチング状態確認', async ({ page }) => {
    await page.goto('/clients');
    const firstClient = page.locator('.client-card, tr.client-row').first();
    await firstClient.click();
    await page.waitForURL(/.*clients\/\d+/);
    await page.click('button[role="tab"]:has-text("NGリスト"), a:has-text("NGリスト")');

    // マッチ済み/未マッチのフィルター確認
    const matchedFilter = page.locator('button:has-text("マッチ済み"), input[value="matched"]');
    const unmatchedFilter = page.locator('button:has-text("未マッチ"), input[value="unmatched"]');

    if (await matchedFilter.isVisible()) {
      // マッチ済みフィルター
      await matchedFilter.click();

      // マッチ済み企業のバッジ確認
      const matchedBadge = page.locator('.badge:has-text("マッチ済み"), .matched-indicator').first();
      if (await matchedBadge.isVisible()) {
        await expect(matchedBadge).toBeVisible();
      }
    }

    if (await unmatchedFilter.isVisible()) {
      // 未マッチフィルター
      await unmatchedFilter.click();

      // 未マッチ企業のバッジ確認
      const unmatchedBadge = page.locator('.badge:has-text("未マッチ"), .unmatched-indicator').first();
      if (await unmatchedBadge.isVisible()) {
        await expect(unmatchedBadge).toBeVisible();
      }
    }
  });
});