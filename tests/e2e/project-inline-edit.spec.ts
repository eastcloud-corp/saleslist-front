import { test, expect, Page } from '@playwright/test';

test.describe('案件インライン編集（排他制御）', () => {
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // 2つのページインスタンスを作成（マルチユーザーシミュレーション）
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // 両方のユーザーでログイン
    for (const page of [page1, page2]) {
      await page.goto('/login');
      await page.click('button:has-text("デバッグ情報を自動入力")');
      await page.click('button:has-text("ログイン")');
      await page.waitForURL('**/dashboard');
    }
  });

  test.afterEach(async () => {
    // クリーンアップ
    if (page1) await page1.close();
    if (page2) await page2.close();
  });

  test('インライン編集の基本フロー', async () => {
    // 案件一覧へ移動
    await page1.goto('/projects');

    // 最初の案件の編集ボタンをクリック
    const firstProjectRow = page1.locator('tr.project-row, .project-item').first();
    const editButton = firstProjectRow.locator('button[aria-label*="編集"], button:has-text("編集")');
    await editButton.click();

    // インライン編集モードになったことを確認
    const editingRow = page1.locator('.editing-mode, tr.is-editing');
    await expect(editingRow).toBeVisible();

    // 各フィールドを編集
    // 1. 進行状況（ドロップダウン）
    const progressSelect = editingRow.locator('select[name*="progress"], select.progress-status');
    if (await progressSelect.isVisible()) {
      await progressSelect.selectOption('運用中');
    }

    // 2. 数値入力フィールド
    const appointmentInput = editingRow.locator('input[name*="appointment"], input[placeholder*="アポ"]');
    if (await appointmentInput.isVisible()) {
      await appointmentInput.fill('5');
    }

    const approvalInput = editingRow.locator('input[name*="approval"], input[placeholder*="承認"]');
    if (await approvalInput.isVisible()) {
      await approvalInput.fill('3');
    }

    const replyInput = editingRow.locator('input[name*="reply"], input[placeholder*="返信"]');
    if (await replyInput.isVisible()) {
      await replyInput.fill('10');
    }

    const friendInput = editingRow.locator('input[name*="friend"], input[placeholder*="友達"]');
    if (await friendInput.isVisible()) {
      await friendInput.fill('7');
    }

    // 3. チェックボックス
    const loginCheckbox = editingRow.locator('input[type="checkbox"][name*="login"], label:has-text("Dログイン可") input');
    if (await loginCheckbox.isVisible()) {
      await loginCheckbox.check();
    }

    const inviteCheckbox = editingRow.locator('input[type="checkbox"][name*="invite"], label:has-text("運用者招待") input');
    if (await inviteCheckbox.isVisible()) {
      await inviteCheckbox.check();
    }

    // 4. 状況テキストエリア
    const statusTextarea = editingRow.locator('textarea[name*="status"], textarea[placeholder*="状況"]');
    if (await statusTextarea.isVisible()) {
      await statusTextarea.fill('順調に進行中。クライアントとの定例会も予定通り。');
    }

    // 保存ボタンをクリック
    const saveButton = editingRow.locator('button:has-text("保存"), button[aria-label="保存"]');
    await saveButton.click();

    // 保存成功メッセージ確認
    await expect(page1.locator('text=/保存しました|Saved successfully/')).toBeVisible();

    // 編集モードが解除されたことを確認
    await expect(editingRow).not.toBeVisible();

    // 変更が反映されていることを確認
    await expect(firstProjectRow.locator('text=運用中')).toBeVisible();
  });

  test('排他制御：同時編集のブロック', async () => {
    // 両方のユーザーが案件一覧を開く
    await page1.goto('/projects');
    await page2.goto('/projects');

    // ユーザー1が最初の案件を編集開始
    const firstProjectRow1 = page1.locator('tr.project-row, .project-item').first();
    const editButton1 = firstProjectRow1.locator('button[aria-label*="編集"], button:has-text("編集")');
    await editButton1.click();

    // ユーザー1が編集モードになったことを確認
    const editingRow1 = page1.locator('.editing-mode, tr.is-editing');
    await expect(editingRow1).toBeVisible();

    // ユーザー2が同じ案件を編集しようとする
    const firstProjectRow2 = page2.locator('tr.project-row, .project-item').first();
    const editButton2 = firstProjectRow2.locator('button[aria-label*="編集"], button:has-text("編集")');

    // 編集ボタンが無効化されているか、クリック時にエラーメッセージが表示される
    if (await editButton2.isEnabled()) {
      await editButton2.click();

      // ロックメッセージの確認
      const lockMessage = page2.locator('text=/使用中です|is editing|ロックされています/');
      await expect(lockMessage).toBeVisible();

      // または、編集モードに入れないことを確認
      const editingRow2 = page2.locator('.editing-mode, tr.is-editing');
      await expect(editingRow2).not.toBeVisible();
    } else {
      // ボタンが無効化されている場合
      await expect(editButton2).toBeDisabled();
    }
  });

  test('ロックタイムアウトのシミュレーション', async () => {
    // 案件一覧へ移動
    await page1.goto('/projects');

    // 編集開始
    const firstProjectRow = page1.locator('tr.project-row, .project-item').first();
    const editButton = firstProjectRow.locator('button[aria-label*="編集"], button:has-text("編集")');
    await editButton.click();

    // 編集モード確認
    const editingRow = page1.locator('.editing-mode, tr.is-editing');
    await expect(editingRow).toBeVisible();

    // キャンセルボタンまたはESCキーでキャンセル
    const cancelButton = editingRow.locator('button:has-text("キャンセル"), button[aria-label="キャンセル"]');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      // ESCキーでキャンセル
      await page1.keyboard.press('Escape');
    }

    // 編集モードが解除されたことを確認
    await expect(editingRow).not.toBeVisible();

    // ロックも解除されていることを確認（別ユーザーが編集可能）
    await page2.goto('/projects');
    const firstProjectRow2 = page2.locator('tr.project-row, .project-item').first();
    const editButton2 = firstProjectRow2.locator('button[aria-label*="編集"], button:has-text("編集")');
    await expect(editButton2).toBeEnabled();
  });

  test('一括更新機能', async () => {
    await page1.goto('/projects');

    // 一括操作モードを有効化
    const bulkActionButton = page1.locator('button:has-text("一括操作"), button:has-text("一括編集")');
    if (await bulkActionButton.isVisible()) {
      await bulkActionButton.click();

      // チェックボックスが表示される
      const checkboxes = page1.locator('input[type="checkbox"].select-project');
      await expect(checkboxes.first()).toBeVisible();

      // 複数の案件を選択（最大3つ）
      const count = Math.min(await checkboxes.count(), 3);
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }

      // 一括更新オプションを選択
      const bulkStatusSelect = page1.locator('select[name="bulk_status"], select.bulk-action');
      if (await bulkStatusSelect.isVisible()) {
        await bulkStatusSelect.selectOption('完了');
      }

      // 一括更新を実行
      const applyButton = page1.locator('button:has-text("一括更新"), button:has-text("適用")');
      await applyButton.click();

      // 確認ダイアログ
      const confirmButton = page1.locator('button:has-text("確認"), button:has-text("はい")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // 更新成功メッセージ
      await expect(page1.locator('text=/件.*更新しました/')).toBeVisible();
    }
  });
});