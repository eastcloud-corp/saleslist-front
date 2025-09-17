import { test, expect } from '@playwright/test';

test.describe('案件-企業連携（NG判定付き）', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/login');
    await page.click('button:has-text("デバッグ情報を自動入力")');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('**/dashboard');
  });

  test('クライアント経由で企業を案件に追加（NG企業グレーアウト確認）', async ({ page }) => {
    // クライアント一覧から詳細へ
    await page.goto('/clients');
    const firstClient = page.locator('.client-card, tr.client-row').first();
    const clientName = await firstClient.locator('.client-name, td:first-child').textContent();
    await firstClient.click();
    await page.waitForURL(/.*clients\/\d+/);

    // 「営業対象企業を選択」ボタンをクリック
    await page.click('button:has-text("営業対象企業を選択"), a:has-text("営業対象企業を選択")');
    await page.waitForURL(/.*select-companies/);

    // 企業選択画面でNG企業のグレーアウト確認
    const ngCompanies = page.locator('.bg-red-50, tr.ng-company');
    const ngCount = await ngCompanies.count();

    if (ngCount > 0) {
      // NG企業の特徴を確認
      const firstNgCompany = ngCompanies.first();

      // 赤背景（bg-red-50）の確認
      await expect(firstNgCompany).toHaveClass(/bg-red-50/);

      // NGバッジの確認
      const ngBadge = firstNgCompany.locator('.badge:has-text("NG"), span:has-text("NG")');
      await expect(ngBadge).toBeVisible();

      // チェックボックスが無効化されていることを確認
      const checkbox = firstNgCompany.locator('input[type="checkbox"]');
      await expect(checkbox).toBeDisabled();

      // ツールチップでNG理由を確認（ホバー時）
      await firstNgCompany.hover();
      const tooltip = page.locator('[role="tooltip"], .tooltip-content');
      if (await tooltip.isVisible()) {
        const reason = await tooltip.textContent();
        expect(reason).toBeTruthy();
      }
    }

    // 通常企業（NG以外）を選択
    const normalCompanies = page.locator('tr:not(.ng-company):not(.bg-red-50) input[type="checkbox"]:not(:disabled)');
    const selectCount = Math.min(await normalCompanies.count(), 3);

    for (let i = 0; i < selectCount; i++) {
      await normalCompanies.nth(i).check();
    }

    // 案件選択または作成
    const projectSelect = page.locator('select[name="project_id"], select[name="project"]');
    if (await projectSelect.isVisible()) {
      // 既存案件を選択
      const options = await projectSelect.locator('option').count();
      if (options > 1) {
        await projectSelect.selectOption({ index: 1 });
      }
    }

    // 企業を案件に追加
    await page.click('button:has-text("案件に追加"), button:has-text("追加")');

    // 成功メッセージ確認
    await expect(page.locator('text=/追加しました|Added successfully/')).toBeVisible();

    // 案件詳細へ遷移（リダイレクトまたは手動遷移）
    if (page.url().includes('/projects/')) {
      // 自動遷移した場合
      await page.waitForURL(/.*projects\/\d+/);
    } else {
      // 手動で案件詳細へ
      await page.goto('/projects');
      const firstProject = page.locator('.project-card, tr.project-row').first();
      await firstProject.click();
    }

    // 追加した企業が表示されることを確認
    const projectCompanies = page.locator('.project-companies, .company-list');
    await expect(projectCompanies).toBeVisible();

    // 営業ステータスの変更
    const statusSelect = page.locator('select[name*="status"], select.sales-status').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('DM送信予定');

      // 変更が保存されることを確認
      await expect(page.locator('text=/保存しました|Saved/')).toBeVisible();
    }
  });

  test('should add company to project and display in project screen', async ({ page }) => {
    // 案件一覧へ移動
    await page.goto('/projects');

    // 既存の案件を選択（または新規作成）
    let projectName = 'テスト案件_' + Date.now();

    // 新規案件作成
    await page.click('a:has-text("新規案件")');
    await page.waitForURL('**/projects/new');

    await page.fill('input[name="name"]', projectName);
    await page.fill('textarea[name="description"]', 'E2Eテスト用案件');
    await page.selectOption('select[name="status"]', '提案準備中');
    await page.fill('input[name="budget"]', '1000000');
    await page.click('button:has-text("作成")');

    // 案件詳細ページへ遷移
    await page.waitForURL(/.*projects\/\d+/);

    // 企業追加ボタンをクリック
    await page.click('button:has-text("企業を追加")');

    // モーダルまたは企業選択画面が開く
    await expect(page.locator('.company-selection-modal, .company-selection-page')).toBeVisible();

    // 企業を検索
    await page.fill('input[placeholder*="企業名"]', 'テスト');

    // 検索結果から企業を選択
    const companyItem = page.locator('.company-item').first();
    const companyName = await companyItem.locator('.company-name').textContent();
    await companyItem.locator('button:has-text("追加")').click();

    // 確認メッセージまたはトースト通知
    await expect(page.locator('text=/追加しました|Added successfully/')).toBeVisible();

    // モーダルを閉じる（必要に応じて）
    const closeButton = page.locator('button:has-text("閉じる"), button:has-text("Close")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // 案件画面に追加した企業が表示されることを確認
    await expect(page.locator(`text="${companyName}"`)).toBeVisible();

    // 企業のステータスやアクション確認
    const addedCompany = page.locator(`.project-company:has-text("${companyName}")`);
    await expect(addedCompany).toBeVisible();

    // 営業ステータスが変更可能であることを確認
    await addedCompany.locator('select[name="sales_status"]').selectOption('DM送信予定');

    // 変更が保存されることを確認
    await expect(page.locator('text=/保存しました|Saved/')).toBeVisible();
  });

  test('should remove company from project', async ({ page }) => {
    // 既存の案件詳細ページへ移動
    await page.goto('/projects');
    const firstProject = page.locator('.project-card').first();
    await firstProject.click();

    // 企業が紐付いていることを確認
    const companyList = page.locator('.project-companies');
    const companiesCount = await companyList.locator('.company-item').count();

    if (companiesCount > 0) {
      // 最初の企業の削除ボタンをクリック
      const firstCompany = companyList.locator('.company-item').first();
      const companyName = await firstCompany.locator('.company-name').textContent();

      await firstCompany.locator('button[aria-label="削除"], button:has-text("削除")').click();

      // 確認ダイアログが表示される場合
      const confirmDialog = page.locator('.confirm-dialog, [role="dialog"]');
      if (await confirmDialog.isVisible()) {
        await page.click('button:has-text("確認"), button:has-text("はい")');
      }

      // 企業が削除されたことを確認
      await expect(page.locator(`text="${companyName}"`)).not.toBeVisible();

      // 削除成功メッセージ
      await expect(page.locator('text=/削除しました|Removed successfully/')).toBeVisible();
    }
  });

  test('should bulk update companies in project', async ({ page }) => {
    await page.goto('/projects');
    const firstProject = page.locator('.project-card').first();
    await firstProject.click();

    // 一括操作モードを有効化
    await page.click('button:has-text("一括操作"), button:has-text("Bulk Actions")');

    // 複数の企業を選択
    const checkboxes = page.locator('input[type="checkbox"].company-select');
    const count = await checkboxes.count();

    if (count >= 2) {
      // 最初の2つを選択
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // 一括ステータス変更
      await page.selectOption('select[name="bulk_status"]', 'アプローチ中');
      await page.click('button:has-text("一括更新")');

      // 確認ダイアログ
      await page.click('button:has-text("確認")');

      // 更新成功メッセージ
      await expect(page.locator('text=/2件.*更新しました/')).toBeVisible();

      // ステータスが更新されたことを確認
      const updatedCompanies = page.locator('.company-item:has(select[value="アプローチ中"])');
      await expect(updatedCompanies).toHaveCount(2);
    }
  });
});