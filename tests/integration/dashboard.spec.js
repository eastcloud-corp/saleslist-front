const { test, expect } = require('@playwright/test')

async function login(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/companies/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}

test.describe('ダッシュボード画面統合テスト', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('ダッシュボードの主要ウィジェットが表示される', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    await expect(page.getByText('営業活動の概要と最新情報')).toBeVisible()
    await expect(page.getByText('最近の案件')).toBeVisible()
    await expect(page.getByText('最近の企業')).toBeVisible()
  })

  test('ナビゲーションから各主要ページへ遷移できる', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'クライアント' }).click()
    await expect(page).toHaveURL(/\/clients/)
    await page.getByRole('link', { name: '企業リスト' }).click()
    await expect(page).toHaveURL(/\/companies/)
    await page.getByRole('link', { name: '案件' }).click()
    await expect(page).toHaveURL(/\/projects/)
  })
})
