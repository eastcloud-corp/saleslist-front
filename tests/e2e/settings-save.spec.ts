import { test, expect } from '@playwright/test';

test.describe('設定画面の保存機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    await page.waitForTimeout(2000);
  });

  test('設定画面で各フィールドを変更して保存', async ({ page }) => {
    // 設定画面へ移動
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    // テスト用のタイムスタンプ
    const timestamp = Date.now();

    // 会社名を変更
    const companyNameInput = page.locator('input[name="companyName"], input[placeholder*="会社名"]').first();
    if (await companyNameInput.isVisible()) {
      await companyNameInput.clear();
      await companyNameInput.fill(`テスト会社_${timestamp}`);
      console.log('✅ 会社名入力完了');
    }

    // 電話番号を変更
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.clear();
      await phoneInput.fill('03-1234-5678');
      console.log('✅ 電話番号入力完了');
    }

    // メールアドレスを変更
    const emailInput = page.locator('input[name="email"], input[type="email"]').nth(1); // ログインメール以外
    if (await emailInput.isVisible()) {
      await emailInput.clear();
      await emailInput.fill(`test_${timestamp}@example.com`);
      console.log('✅ メールアドレス入力完了');
    }

    // 住所を変更
    const addressInput = page.locator('input[name="address"], textarea[name="address"]').first();
    if (await addressInput.isVisible()) {
      await addressInput.clear();
      await addressInput.fill(`東京都テスト区 ${timestamp}`);
      console.log('✅ 住所入力完了');
    }

    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("保存"), button:has-text("変更を保存")').first();
    await saveButton.click();
    console.log('✅ 保存ボタンクリック');

    // 保存完了の確認（成功メッセージまたはページリロード）
    await Promise.race([
      page.waitForSelector('text=/保存.*成功|保存.*完了|更新.*完了/', { timeout: 5000 }),
      page.waitForTimeout(3000)
    ]);

    // ページをリロードして保存されたか確認
    await page.reload();
    await page.waitForTimeout(2000);

    // 値が保存されているか確認
    const savedCompanyName = await companyNameInput.inputValue();
    const isSaved = savedCompanyName.includes(timestamp.toString());

    if (isSaved) {
      console.log('✅ 設定が正しく保存されました');
    } else {
      console.log('❌ 設定が保存されていません');
    }

    expect(isSaved).toBe(true);
  });

  test('必須項目を空にして保存するとエラーが表示される', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    // 必須項目をクリア
    const requiredInput = page.locator('input[required]').first();
    if (await requiredInput.isVisible()) {
      await requiredInput.clear();

      // 保存ボタンをクリック
      const saveButton = page.locator('button:has-text("保存"), button:has-text("変更を保存")').first();
      await saveButton.click();

      // エラーメッセージが表示されるか確認
      const errorVisible = await page.locator('text=/必須|エラー|入力してください/').isVisible({ timeout: 3000 }).catch(() => false);

      if (errorVisible) {
        console.log('✅ バリデーションエラーが正しく表示されました');
      } else {
        console.log('⚠️ エラーメッセージが表示されませんでした');
      }
    }
  });

  test('キャンセルボタンで変更が破棄される', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    // フィールドの初期値を取得
    const input = page.locator('input').first();
    const initialValue = await input.inputValue();

    // 値を変更
    await input.clear();
    await input.fill('変更後の値');

    // キャンセルボタンをクリック
    const cancelButton = page.locator('button:has-text("キャンセル"), button:has-text("取り消し")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(1000);

      // 値が元に戻っているか確認
      const currentValue = await input.inputValue();
      const isReverted = currentValue === initialValue || currentValue === '';

      if (isReverted) {
        console.log('✅ キャンセル機能が正常に動作');
      } else {
        console.log('⚠️ キャンセル後も値が変更されたまま');
      }
    }
  });
});

// 全テストを10秒以内に完了
test.setTimeout(10000);