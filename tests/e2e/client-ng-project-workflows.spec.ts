import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  createAuthenticatedContext,
  createClient,
  createCompany,
  createProject,
  createUser,
  deleteResource,
  updateUser,
  attachConsoleErrorInspector,
} from './helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'salesnav_admin@budget-sales.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'salesnav20250901'

const PAGE_LOCK_PARAMS = { page: 1, page_size: 20, filter_hash: 'default' }

test.describe.serial('NGリストと案件管理フロー', () => {
  let adminApi: Awaited<ReturnType<typeof createAuthenticatedContext>>['context']
  let otherUserApi: Awaited<ReturnType<typeof createAuthenticatedContext>>['context']

  const testData = {
    clientId: 0,
    projectId: 0,
    projectName: '',
    csvUnmatchedName: '',
    companies: {
      matched: { id: 0, name: '' },
      search: { id: 0, name: '' },
      candidateA: { id: 0, name: '' },
      candidateB: { id: 0, name: '' },
    },
    otherUser: {
      id: 0,
      name: '',
      email: '',
      password: '',
    },
  }

  test.beforeEach(({ page }) => {
    attachConsoleErrorInspector(page)
  })

  async function loginUI(page: Page, credentials?: { email: string; password: string }) {
    await page.goto('/login')

    if (credentials) {
      await page.getByLabel('メールアドレス').fill(credentials.email)
      await page.getByLabel('パスワード').fill(credentials.password)
    } else {
      await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
    }

    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL(/\/companies/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
  }

  test.beforeAll(async () => {
    const adminAuth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
    adminApi = adminAuth.context

    const unique = Date.now()
    const client = await createClient(adminApi, {
      name: `E2Eクライアント-${unique}`,
      industry: 'IT・ソフトウェア',
      contact_email: `client-${unique}@example.com`,
    })
    testData.clientId = client.id

    const baseCompanyPayload = {
      industry: 'IT・ソフトウェア',
      prefecture: '東京都',
      city: '千代田区',
      employee_count: 120,
      revenue: 500000000,
      established_year: 2018,
      website_url: 'https://example.com',
      contact_email: 'info@example.com',
      phone: '03-0000-0000',
    }

    const matchedCompany = await createCompany(adminApi, {
      ...baseCompanyPayload,
      name: `E2Eマッチ企業-${unique}`,
    })
    const searchCompany = await createCompany(adminApi, {
      ...baseCompanyPayload,
      name: `E2ENG追加企業-${unique}`,
    })
    const candidateA = await createCompany(adminApi, {
      ...baseCompanyPayload,
      name: `E2E候補A-${unique}`,
    })
    const candidateB = await createCompany(adminApi, {
      ...baseCompanyPayload,
      name: `E2E候補B-${unique}`,
    })

    testData.companies = {
      matched: { id: matchedCompany.id, name: matchedCompany.name },
      search: { id: searchCompany.id, name: searchCompany.name },
      candidateA: { id: candidateA.id, name: candidateA.name },
      candidateB: { id: candidateB.id, name: candidateB.name },
    }
    testData.csvUnmatchedName = `CSV未登録-${unique}`

    const project = await createProject(adminApi, {
      name: `E2E案件-${unique}`,
      client_id: client.id,
      description: 'E2E integration project',
    })
    testData.projectId = project.id
    testData.projectName = project.name

    const otherUserEmail = `e2e.secondary+${unique}@example.com`
    const otherUserPassword = `Passw0rd!${unique.toString().slice(-4)}`
    const otherUser = await createUser(adminApi, {
      email: otherUserEmail,
      name: 'E2E副ユーザー',
      password: otherUserPassword,
      role: 'user',
    })
    testData.otherUser = {
      id: otherUser.id,
      name: otherUser.name,
      email: otherUserEmail,
      password: otherUserPassword,
    }

    const otherAuth = await createAuthenticatedContext(otherUserEmail, otherUserPassword)
    otherUserApi = otherAuth.context
  })

  test.afterAll(async () => {
    try {
      if (otherUserApi) {
        await otherUserApi.delete(`/api/v1/projects/page-unlock/?page=${PAGE_LOCK_PARAMS.page}&page_size=${PAGE_LOCK_PARAMS.page_size}&filter_hash=${PAGE_LOCK_PARAMS.filter_hash}`)
      }
    } catch {
      // ignore cleanup errors
    }

    const companyIds = new Set<number>()
    Object.values(testData.companies).forEach((company) => {
      if (company?.id) {
        companyIds.add(company.id)
      }
    })

    try {
      if (testData.projectId) {
        await deleteResource(adminApi, `/projects/${testData.projectId}/`)
      }
    } catch {
      /* noop */
    }

    try {
      if (testData.clientId) {
        await deleteResource(adminApi, `/clients/${testData.clientId}/`)
      }
    } catch {
      /* noop */
    }

    for (const companyId of companyIds) {
      try {
        await deleteResource(adminApi, `/companies/${companyId}/`)
      } catch {
        /* noop */
      }
    }

    if (testData.otherUser.id) {
      try {
        await updateUser(adminApi, testData.otherUser.id, { is_active: false })
      } catch {
        /* noop */
      }
    }

    await adminApi?.dispose()
    await otherUserApi?.dispose()
  })

  test('テストシナリオ1: NGリスト管理フロー', async ({ page }) => {
    await loginUI(page)
    await page.goto(`/clients/${testData.clientId}`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: 'NGリスト' }).click()
    await expect(page.getByText('企業検索からNG企業追加')).toBeVisible()

    const csvContent = `企業名,理由\n${testData.companies.matched.name},既存登録企業\n${testData.csvUnmatchedName},未登録企業\n`
    await page.setInputFiles('input#csv-import', {
      name: 'ng-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    })

    await expect(
      page.getByRole('cell', { name: testData.companies.matched.name, exact: true }).first()
    ).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByRole('cell', { name: testData.csvUnmatchedName, exact: true }).first()
    ).toBeVisible()
    await expect(page.getByText('マッチ済: 1')).toBeVisible()
    await expect(page.getByText('未マッチ: 1')).toBeVisible()

    await page.getByRole('button', { name: '企業検索' }).click()
    const dialog = page.getByRole('dialog', { name: '企業検索からNG企業追加' })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('企業名で検索').fill(testData.companies.search.name)
    const resultRow = dialog.locator('tr').filter({ hasText: testData.companies.search.name }).first()
    await resultRow.click()
    await dialog.getByLabel('NG理由（任意）').fill('競合企業のため')
    await dialog.getByRole('button', { name: 'NGリストに追加' }).click()
    await expect(dialog).toBeHidden()

    await expect(
      page.getByRole('cell', { name: testData.companies.search.name, exact: true }).first()
    ).toBeVisible()

    page.once('dialog', (dialogEvent) => dialogEvent.accept())
    await page.getByRole('button', { name: `${testData.csvUnmatchedName}をNGリストから削除` }).click()
    await expect(page.getByRole('cell', { name: testData.csvUnmatchedName })).toHaveCount(0)
    await expect(page.getByText('マッチ済: 2')).toBeVisible()
    await expect(page.getByText('未マッチ: 0')).toBeVisible()
  })

  test('テストシナリオ2: 案件への企業追加（NG判定付き）', async ({ page }) => {
    await loginUI(page)
    await page.goto(`/clients/${testData.clientId}/select-companies`)
    await page.waitForLoadState('networkidle')

    const tableRows = page.locator('table tbody tr')
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 })

    const searchInput = page.getByPlaceholder('企業名で検索')
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/api/v1/clients/${testData.clientId}/available-companies`) &&
        response.request().method() === 'GET' &&
        response.url().includes(encodeURIComponent(testData.companies.search.name))
      ),
      searchInput.fill(testData.companies.search.name),
    ])

    const ngCandidateRow = page.locator('tr').filter({ hasText: testData.companies.search.name }).first()
    await expect(ngCandidateRow).toBeVisible()
    await expect(ngCandidateRow.locator('[role="checkbox"]').first()).toBeDisabled()
    await expect(ngCandidateRow.getByText('NG', { exact: true })).toBeVisible()

    await searchInput.fill('')
    await page.waitForTimeout(500)

    await expect(
      page.getByRole('cell', { name: testData.companies.candidateA.name, exact: true })
    ).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByRole('cell', { name: testData.companies.candidateB.name, exact: true })
    ).toBeVisible({ timeout: 15000 })

    const candidateARow = page.locator('tr').filter({ hasText: testData.companies.candidateA.name }).first()
    const candidateBRow = page.locator('tr').filter({ hasText: testData.companies.candidateB.name }).first()

    await candidateARow.locator('[role="checkbox"]').first().click()
    await candidateBRow.locator('[role="checkbox"]').first().click()
    await expect(page.getByText('2社選択中')).toBeVisible()

    await page.locator('button').filter({ hasText: '既存案件を選択' }).first().click()
    await page.getByRole('option', { name: testData.projectName }).click()

    await page.getByRole('button', { name: '既存案件に追加' }).click()
    await page.waitForURL((url) => url.pathname === `/projects/${testData.projectId}`, { timeout: 20000 })

    await expect(page.getByText(testData.companies.candidateA.name)).toBeVisible()
    await expect(page.getByText(testData.companies.candidateB.name)).toBeVisible()
  })

  test('テストシナリオ3: 案件インライン編集（排他制御）', async ({ page }) => {
    await loginUI(page)
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const editToggle = page.getByRole('button', { name: /編集/ }).first()
    await editToggle.click()

    const projectRow = page.locator(`tr[data-project-id="${testData.projectId}"]`).first()
    await expect(projectRow).toBeVisible()
    await expect(editToggle).toHaveText(/編集完了/)

    await editToggle.click()
    await expect(editToggle).toHaveText(/編集モード/)
  })

  test('テストシナリオ3-追加: 別ユーザーで同時編集試行', async ({ page, browser }) => {
    await loginUI(page)
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const primaryToggle = page.getByRole('button', { name: /編集/ }).first()
    await primaryToggle.click()

    const projectRow = page.locator(`tr[data-project-id="${testData.projectId}"]`).first()
    await expect(projectRow).toBeVisible()
    await expect(primaryToggle).toHaveText(/編集完了/)

    const secondaryContext = await browser.newContext()
    const secondaryPage = await secondaryContext.newPage()

    try {
      await loginUI(secondaryPage, {
        email: testData.otherUser.email,
        password: testData.otherUser.password,
      })
      await secondaryPage.goto('/projects')
      await secondaryPage.waitForLoadState('networkidle')

      const secondaryToggle = secondaryPage.getByRole('button', { name: /編集/ }).first()
      await Promise.all([
        secondaryPage.waitForResponse((response) =>
          response.url().includes('/api/v1/projects/page-lock/') &&
          response.request().method() === 'POST'
        ),
        secondaryToggle.click(),
      ])

      await expect(secondaryToggle).toHaveText(/編集モード/)
      await expect(secondaryPage.getByText('編集モードを開始できません', { exact: true }).first()).toBeVisible()
      await expect(secondaryPage.locator('text=/このページは.+編集中です/').first()).toBeVisible()
    } finally {
      await secondaryContext.close()
    }

    await primaryToggle.click()
    await expect(primaryToggle).toHaveText(/編集モード/)
  })
})
