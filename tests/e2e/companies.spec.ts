import { test, expect, type Page } from '@playwright/test'
import {
  createAuthenticatedContext,
  createClient,
  createCompany,
  createProject,
  deleteResource,
  loginViaApiAndRestoreSession,
} from './helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'salesnav_admin@budget-sales.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'salesnav20250901'

async function login(page: Page) {
  await loginViaApiAndRestoreSession(page, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    redirectPath: '/companies',
  })
}

test.describe('Companies E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('企業一覧テーブルを閲覧できる', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '企業データベース管理' })).toBeVisible({ timeout: 15000 })
    const firstTable = page.locator('table').first()
    await expect(firstTable).toBeVisible()
    const rows = await firstTable.getByRole('row').count()
    expect(rows).toBeGreaterThan(1)
  })

  test('クライアント詳細ページへ遷移できる', async ({ page }) => {
    const adminAuth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
    const adminApi = adminAuth.context

    const unique = Date.now()
    const client = await createClient(adminApi, {
      name: `クライアントE2E-${unique}`,
      industry: 'IT・ソフトウェア',
      contact_email: `client-e2e-${unique}@example.com`,
      phone: '03-5555-6666',
      address: '東京都港区1-1-1',
    })

    try {
      await page.goto('/clients?page=1&page_size=20', { waitUntil: 'networkidle' })
      await page.waitForLoadState('networkidle')

      const targetRow = page.locator('table tbody tr').filter({ hasText: client.name }).first()
      await expect(targetRow).toBeVisible({ timeout: 15000 })
      await targetRow.locator('a').first().click()

      await page.waitForURL(new RegExp(`/clients/${client.id}`), { timeout: 15000 })
      await expect(page.getByRole('button', { name: 'クライアント一覧へ' })).toBeVisible()
      await expect(page.getByRole('heading', { name: client.name })).toBeVisible()
    } finally {
      await deleteResource(adminApi, `/clients/${client.id}/`)
      await adminApi.dispose()
    }
  })

  test('業界フィルターで選択した業界の企業のみを表示できる', async ({ page }) => {
    const adminAuth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
    const adminApi = adminAuth.context

    const unique = Date.now()
    const targetIndustry = 'IT・ソフトウェア'
    const otherIndustry = '製造業'

    const targetCompany = await createCompany(adminApi, {
      name: `フィルター対象企業-${unique}`,
      industry: targetIndustry,
      prefecture: '東京都',
      city: '千代田区',
      employee_count: 120,
      revenue: 150000000,
      established_year: 2015,
      website_url: 'https://filter-target.example.com',
      contact_email: `filter-target-${unique}@example.com`,
      phone: '03-1111-2222',
    })

    const otherCompany = await createCompany(adminApi, {
      name: `フィルター除外企業-${unique}`,
      industry: otherIndustry,
      prefecture: '大阪府',
      city: '大阪市',
      employee_count: 80,
      revenue: 90000000,
      established_year: 2012,
      website_url: 'https://filter-other.example.com',
      contact_email: `filter-other-${unique}@example.com`,
      phone: '06-3333-4444',
    })

    try {
      await page.goto('/companies', { waitUntil: 'networkidle' })
      await page.waitForLoadState('networkidle')

      const filterToggle = page.getByRole('button', { name: /フィルターを/ })
      const toggleText = await filterToggle.textContent()
      if (toggleText?.includes('表示')) {
        await filterToggle.click()
      }

      const industrySelect = page.locator('[role="combobox"][data-state]').first()
      await industrySelect.click()
      await expect
        .poll(
          async () =>
            await page.evaluate(() => document.querySelectorAll('[role="option"]').length),
          {
            message: '業界フィルターの候補が表示されません',
            timeout: 5000,
          },
        )
        .toBeGreaterThan(0)
      const industryOption = page.locator('[role="option"]').filter({ hasText: targetIndustry }).first()
      await expect(industryOption).toBeVisible()
      await industryOption.click()
      await expect(industrySelect).toHaveText(new RegExp(targetIndustry))

      const searchButton = page.getByRole('button', { name: /^検索$/ })
      await expect(searchButton).toBeEnabled()
      await searchButton.click()
      await page.waitForLoadState('networkidle')

      const table = page.locator('table').first()
      await expect(table.locator('tr', { hasText: targetCompany.name })).toBeVisible({ timeout: 20000 })
      await expect(table.locator('tr', { hasText: otherCompany.name })).toHaveCount(0)
    } finally {
      await deleteResource(adminApi, `/companies/${targetCompany.id}/`)
      await deleteResource(adminApi, `/companies/${otherCompany.id}/`)
      await adminApi.dispose()
    }
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
      await page.goto(`/companies?search=${encodeURIComponent(company.name)}`, { waitUntil: 'networkidle' })
      await page.waitForLoadState('networkidle')

      const row = page.locator('table').first().locator('tr', { hasText: company.name }).first()
      await expect(row).toBeVisible({ timeout: 20000 })

      await row.getByRole('checkbox').first().click()

      const addButton = page.getByRole('button', { name: '案件に追加' })
      await addButton.scrollIntoViewIfNeeded()
      await addButton.click()

      const dialog = page.getByRole('dialog', { name: '案件に企業を追加' })
      await expect(dialog).toBeVisible()

      await dialog.getByLabel('案件検索').fill(project.name)
      const projectRow = dialog.getByRole('row', { name: new RegExp(project.name) }).first()
      await expect(projectRow).toBeVisible({ timeout: 15000 })
      await projectRow.getByRole('checkbox', { name: new RegExp(project.name) }).click()

      await expect(dialog.getByRole('button', { name: /案件に追加/ })).toBeEnabled({ timeout: 10000 })
      await dialog.getByRole('button', { name: /案件に追加/ }).click()

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
