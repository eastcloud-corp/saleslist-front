import { test, expect, type Page } from '@playwright/test'
import {
  createAuthenticatedContext,
  createClient,
  createCompany,
  createProject,
  deleteResource,
} from './helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'salesnav_admin@budget-sales.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'salesnav20250901'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  if (!/\/companies\/?$/.test(page.url())) {
    await page.goto('/companies', { waitUntil: 'networkidle' })
  }
}

test.describe('Companies E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('企業一覧テーブルを閲覧できる', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '企業データベース管理' })).toBeVisible()
    const firstTable = page.locator('table').first()
    await expect(firstTable).toBeVisible()
    const rows = await firstTable.getByRole('row').count()
    expect(rows).toBeGreaterThan(1)
  })

  test('クライアント詳細ページへ遷移できる', async ({ page }) => {
    await page.goto('/clients')
    await page.waitForLoadState('networkidle')
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await page.waitForURL(/\/clients\//)
    await expect(page.getByRole('button', { name: 'クライアント一覧へ' })).toBeVisible()
  })

  test('企業一覧から既存案件に企業を追加できる', async ({ page }) => {
    const adminAuth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
    const adminApi = adminAuth.context

    const unique = Date.now()
    const client = await createClient(adminApi, {
      name: `企業UIクライアント-${unique}`,
      industry: 'IT・ソフトウェア',
      contact_email: `client-${unique}@example.com`,
    })

    const project = await createProject(adminApi, {
      name: `企業UI案件-${unique}`,
      client_id: client.id,
      description: 'E2E project for company add flow',
    })

    const company = await createCompany(adminApi, {
      name: `企業UI追加-${unique}`,
      industry: 'IT・ソフトウェア',
      prefecture: '東京都',
      city: '千代田区',
      employee_count: 50,
      revenue: 120000000,
      established_year: 2015,
      website_url: 'https://example.com',
      contact_email: 'info@example.com',
      phone: '03-0000-0000',
    })

    try {
      await page.goto('/companies')

      await Promise.all([
        page.waitForResponse((response) =>
          response.url().includes('/api/v1/companies') &&
          response.request().method() === 'GET' &&
          response.url().includes(encodeURIComponent(company.name))
        ),
        page.getByLabel('企業検索').fill(company.name),
      ])

      const row = page.locator('tr', { hasText: company.name }).first()
      await expect(row).toBeVisible({ timeout: 15000 })

      await row.getByRole('checkbox').first().check()

      await page.getByRole('button', { name: '案件に追加' }).click()

      const dialog = page.getByRole('dialog', { name: '案件に企業を追加' })
      await expect(dialog).toBeVisible()

      const combobox = dialog.getByRole('combobox', { name: '案件を選択' })
      await combobox.click()
      const option = page.getByRole('option', { name: project.name })
      await expect(option).toBeVisible({ timeout: 15000 })
      await option.click()

      await dialog.getByRole('button', { name: '案件に追加' }).click()

      await page.waitForURL(`/projects/${project.id}`)
      await expect(page.getByText(company.name)).toBeVisible({ timeout: 15000 })
    } finally {
      await deleteResource(adminApi, `/projects/${project.id}/`)
      await deleteResource(adminApi, `/clients/${client.id}/`)
      await deleteResource(adminApi, `/companies/${company.id}/`)
      await adminApi.dispose()
    }
  })
})
