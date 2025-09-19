const { test, expect } = require('@playwright/test')

async function login(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/companies/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}

test.describe('顧客要件対応機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

 test('企業一覧がテーブルで表示される', async ({ page }) => {
   await expect(page.getByRole('heading', { name: '企業データベース管理' })).toBeVisible()
   const table = page.getByRole('table')
   await expect(table).toBeVisible()
   const rowCount = await table.getByRole('row').count()
   expect(rowCount).toBeGreaterThan(1)
 })

  test('クライアント詳細に遷移できる', async ({ page }) => {
    await page.goto('/clients')
    await page.waitForLoadState('networkidle')
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await page.waitForURL(/\/clients\//)
    await expect(page.getByRole('button', { name: 'クライアント一覧へ' })).toBeVisible()
  })

  test('ユーザー招待ダイアログでusernameフィールドが表示される', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('button', { name: 'ユーザー作成' }).click()
    await expect(page.getByLabel('ユーザー名')).toBeVisible()
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
  })

  test('案件一覧がテーブル表示である', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')
    const table = page.locator('table').first()
    await expect(table).toBeVisible()
    const rowCount = await table.getByRole('row').count()
    expect(rowCount).toBeGreaterThan(1)
  })
})
