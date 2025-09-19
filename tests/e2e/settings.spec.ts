import { test, expect } from '@playwright/test'

async function login(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/companies/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}

test.describe('Settings E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('ユーザー招待ダイアログを開閉できる', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('button', { name: 'ユーザー作成' }).click()
    await expect(page.getByRole('heading', { name: '新規ユーザー作成' })).toBeVisible()
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    await expect(page.getByLabel('ユーザー名')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  })
})
