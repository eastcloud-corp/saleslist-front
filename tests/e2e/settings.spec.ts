import { test, expect, type Page } from '@playwright/test'
import { loginViaApiAndRestoreSession } from './helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'salesnav_admin@budget-sales.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'salesnav20250901'

async function login(page: Page) {
  await loginViaApiAndRestoreSession(page, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    redirectPath: '/companies',
  })
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
