import { test, expect, Page } from '@playwright/test'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'

async function getAuthHeaders(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  expect(token, 'ログイン後にアクセストークンが取得できませんでした').toBeTruthy()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function apiPost(page: Page, endpoint: string, data: Record<string, unknown>) {
  const headers = await getAuthHeaders(page)
  const response = await page.request.post(`${API_BASE_URL}/api/v1${endpoint}`, {
    data,
    headers,
  })
  expect(response.ok(), `POST ${endpoint} が失敗しました: ${response.status()} ${response.statusText()}`).toBeTruthy()
  return response.json()
}

async function apiGet(page: Page, endpoint: string, params?: Record<string, string>) {
  const headers = await getAuthHeaders(page)
  const response = await page.request.get(`${API_BASE_URL}/api/v1${endpoint}`, {
    params,
    headers,
  })
  expect(response.ok(), `GET ${endpoint} が失敗しました: ${response.status()} ${response.statusText()}`).toBeTruthy()
  return response.json()
}

function extractFirstMatch<T extends { name?: string }>(data: any, predicate: (item: any) => boolean): T | undefined {
  if (!data) return undefined
  if (Array.isArray(data.results)) {
    return data.results.find(predicate)
  }
  if (Array.isArray(data)) {
    return data.find(predicate)
  }
  return undefined
}

async function createClient(page: Page, name: string) {
  await apiPost(page, '/clients/', {
    name,
  })

  const list = await apiGet(page, '/clients/', {
    search: name,
    page_size: '1',
  })

  const client = extractFirstMatch<{ id: number; name: string }>(list, (item) => item.name === name)
  expect(client, `作成したクライアント「${name}」が一覧から取得できません`).toBeTruthy()
  return client as { id: number; name: string }
}

async function createProject(page: Page, name: string, clientId: number) {
  await apiPost(page, '/projects/', {
    name,
    client_id: clientId,
  })

  const list = await apiGet(page, '/projects/', {
    search: name,
    page_size: '1',
  })

  const project = extractFirstMatch<{ id: number; name: string }>(list, (item) => item.name === name)
  expect(project, `作成した案件「${name}」が一覧から取得できません`).toBeTruthy()
  return project as { id: number; name: string }
}

test.describe('案件インライン編集（排他制御）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30_000 })
  })

  test('編集モードで数値とメモを更新できる', async ({ page }) => {
    const clientName = `E2E案件用クライアント-${Date.now()}`
    const client = await createClient(page, clientName)
    const projectName = `E2E案件-${Date.now()}`
    await createProject(page, projectName, client.id)

    await page.goto('/projects')
    const projectRow = page.locator('div.flex-1 table tbody tr', { hasText: projectName }).first()
    await expect(projectRow).toBeVisible({ timeout: 30_000 })

    const toggleButton = page.getByRole('button', { name: /編集モード/ })
    await toggleButton.click()
    await expect(page.getByRole('button', { name: /編集完了/ })).toBeVisible({ timeout: 30_000 })

    const gridTable = projectRow
    const appointmentInput = gridTable.locator('input[type="number"]').first()
    await appointmentInput.fill('7')

    const situationTextarea = gridTable.locator('textarea').first()
    const memoText = `自動テスト更新-${Date.now()}`
    await situationTextarea.fill(memoText)

    const finishButton = page.getByRole('button', { name: /編集完了/ })
    await Promise.all([
      page.waitForLoadState('networkidle'),
      finishButton.click(),
    ])

    await expect(page.getByRole('button', { name: /編集モード/ })).toBeVisible({ timeout: 30_000 })

    const refreshedRow = page.locator('div.flex-1 table tbody tr', { hasText: projectName }).first()
    await expect(refreshedRow.locator('td').nth(1)).toContainText('7')
    await expect(refreshedRow).toContainText(memoText)
  })

  test('編集モードの切り替えで入力UIが表示・非表示になる', async ({ page }) => {
    const clientName = `E2E案件UIクライアント-${Date.now()}`
    const client = await createClient(page, clientName)
    const projectName = `E2E案件UI-${Date.now()}`
    await createProject(page, projectName, client.id)

    await page.goto('/projects')
    await expect(page.locator('div.flex-1 table textarea')).toHaveCount(0, { timeout: 30_000 })

    const toggleButton = page.getByRole('button', { name: /編集モード/ })
    await toggleButton.click()
    await expect(page.locator('div.flex-1 table textarea').first()).toBeVisible()

    const finishButton = page.getByRole('button', { name: /編集完了/ })
    await finishButton.click()
    await expect(page.locator('div.flex-1 table textarea')).toHaveCount(0)
  })
})
