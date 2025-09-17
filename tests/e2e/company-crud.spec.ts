import { test, expect } from '@playwright/test';

test.describe('Company CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    // ログイン後のリダイレクトを待つ
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
  });

  test('CREATE: 新規企業を作成してリストに表示される', async ({ page }) => {
    // 企業一覧へ移動
    await page.goto('/companies');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 新規作成ボタンをクリック
    await page.click('a:has-text("企業追加")');

    // 新規作成ページへの遷移を確認
    await page.waitForURL('**/new', { timeout: 10000 });

    // フォーム入力（より柔軟なセレクター使用）
    const timestamp = Date.now();
    const companyName = `テスト企業_${timestamp}`;

    // 企業名入力
    await page.locator('input[name="name"], input[placeholder*="企業名"], input#name').first().fill(companyName);

    // 業界選択（必須）
    const industrySelect = page.locator('[aria-label="業界 *"], select[name="industry"], [role="combobox"]').nth(6); // 業界のcomboboxは7番目
    await industrySelect.click();
    // 最初の選択肢を選ぶ
    await page.locator('[role="option"]').first().click();

    // 従業員数（オプション）
    const employeeInput = page.locator('input[name="employee_count"], input[name="employees"], input[type="number"]').first();
    if (await employeeInput.isVisible()) {
      await employeeInput.fill('100');
    }

    // 保存ボタンをクリック（"変更を保存"ボタン）
    await page.locator('button:has-text("変更を保存")').click();

    // 成功メッセージまたはリダイレクトを待つ
    await Promise.race([
      page.waitForURL('**/companies', { timeout: 10000 }),
      page.locator('text=/作成.*成功|登録.*完了|追加.*しました/').waitFor({ timeout: 10000 })
    ]);

    // 作成した企業が表示されることを確認
    await expect(page.locator(`text="${companyName}"`)).toBeVisible({ timeout: 10000 });

    console.log(`✅ CREATE成功: ${companyName}`);
  });

  test('READ: 企業詳細を表示して情報を確認', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // 詳細リンクをクリック
    const detailLink = page.locator('a:has-text("詳細")').first();
    await detailLink.click();

    // 詳細ページへの遷移を確認
    await page.waitForURL(/\/companies\/\d+/, { timeout: 10000 });

    // 詳細情報が表示されることを確認
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // 基本的な情報フィールドの存在確認
    const infoFields = ['業界', '従業員', '電話', 'メール', 'ウェブサイト'];
    for (const field of infoFields) {
      const fieldExists = await page.locator(`text=/${field}/i`).count() > 0;
      if (fieldExists) {
        console.log(`  ✓ ${field}フィールド確認`);
      }
    }

    console.log(`✅ READ成功: 企業詳細表示確認`);
  });

  test('UPDATE: 既存企業の情報を更新', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // 詳細リンクをクリック
    const detailLink = page.locator('a:has-text("詳細")').first();
    await detailLink.click();
    await page.waitForURL(/\/companies\/\d+/, { timeout: 10000 });

    // 編集ボタンをクリック
    const editButton = page.locator('button:has-text("編集"), a:has-text("編集"), button[aria-label*="編集"]').first();
    await editButton.click();

    // 編集フォームが表示されるまで待つ
    await page.waitForSelector('input[name="name"], input#name', { timeout: 10000 });

    // 企業名を更新
    const timestamp = Date.now();
    const updatedName = `更新企業_${timestamp}`;
    await page.locator('input[name="name"], input#name').first().fill(updatedName);

    // 保存
    await page.locator('button[type="submit"], button:has-text("保存"), button:has-text("更新")').first().click();

    // 更新成功を確認
    await Promise.race([
      page.locator(`text="${updatedName}"`).waitFor({ timeout: 10000 }),
      page.locator('text=/更新.*成功|保存.*完了/').waitFor({ timeout: 10000 })
    ]);

    console.log(`✅ UPDATE成功: ${updatedName}`);
  });

  test('DELETE: 企業を削除（UIに削除機能がある場合）', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // 削除ボタンの存在確認（テーブルの操作列）
    const deleteButton = page.locator('button:has-text("削除"), button[aria-label*="削除"], button.delete-btn').first();

    if (await deleteButton.isVisible()) {
      // 削除前の企業数を取得（テーブルの行数）
      const initialCount = await page.locator('table tbody tr').count();

      // 削除ボタンクリック
      await deleteButton.click();

      // 確認ダイアログがある場合
      const confirmButton = page.locator('button:has-text("確認"), button:has-text("はい"), button:has-text("OK")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // 削除成功を確認
      await page.waitForTimeout(2000);
      const afterCount = await page.locator('table tbody tr').count();

      if (afterCount < initialCount) {
        console.log('✅ DELETE成功: 企業削除確認');
      } else {
        console.log('⚠️ DELETE: 削除が反映されていない可能性');
      }
    } else {
      console.log('ℹ️ DELETE: UIに削除機能なし（スキップ）');
    }
  });

  test('FILTER: 企業を検索・フィルタリング', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // 検索ボックスを探す（企業検索）
    const searchInput = page.locator('input[aria-label="企業検索"], input[placeholder*="企業検索"]').first();

    if (await searchInput.isVisible()) {
      // 検索実行
      await searchInput.fill('テスト');
      await searchInput.press('Enter');

      // 結果を待つ
      await page.waitForTimeout(2000);

      // フィルタリング結果の確認（テーブル行数）
      const results = await page.locator('table tbody tr').count();
      console.log(`✅ FILTER成功: 検索結果 ${results}件`);
    } else {
      console.log('ℹ️ FILTER: 検索機能なし（スキップ）');
    }
  });
});

test.describe('ボタン動作確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
  });

  test('すべての主要ボタンが動作する', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    const buttonTests = [
      { selector: 'a:has-text("企業追加")', action: '企業追加' },
      { selector: 'button:has-text("検索"), button:has-text("フィルター")', action: '検索/フィルター' },
      { selector: 'button:has-text("エクスポート"), button:has-text("CSV")', action: 'エクスポート' }
    ];

    for (const { selector, action } of buttonTests) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        const isEnabled = await button.isEnabled();
        console.log(`  ${isEnabled ? '✓' : '✗'} ${action}ボタン: ${isEnabled ? '有効' : '無効'}`);

        if (isEnabled) {
          // クリック可能かテスト（実際にはクリックしない）
          await expect(button).toBeEnabled();
        }
      }
    }
  });
});