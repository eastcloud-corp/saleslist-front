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

test.describe('E2E Smoke Tests', () => {
  test('ログイン後にナビゲーションが表示される', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('link', { name: 'ダッシュボード' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'クライアント' })).toBeVisible()
    await expect(page.getByRole('link', { name: '案件' })).toBeVisible()
    await expect(page.getByRole('link', { name: '企業管理' })).toBeVisible()
  })

  test('ダッシュボードの主要ウィジェットを参照できる', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    await expect(page.getByText('最近の案件', { exact: false })).toBeVisible()
    await expect(page.getByText('最近の企業', { exact: false })).toBeVisible()
  })
})
