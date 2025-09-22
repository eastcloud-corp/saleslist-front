import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/companies/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
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
