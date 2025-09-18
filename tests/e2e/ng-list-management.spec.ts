import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

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

async function createClient(page: Page, name?: string) {
  const clientName = name ?? `E2Eクライアント-${Date.now()}`
  await apiPost(page, '/clients/', {
    name: clientName,
    contact_person: 'テスト担当',
    contact_email: 'test@example.com',
    contact_phone: '03-0000-0000',
  })

  const list = await apiGet(page, '/clients/', {
    search: clientName,
    page_size: '1',
  })

  const client = extractFirstMatch(list, (item) => item.name === clientName)
  expect(client, `作成したクライアント「${clientName}」が一覧から取得できません`).toBeTruthy()
  return client as { id: number; name: string }
}

async function createCompany(page: Page, name?: string) {
  const companyName = name ?? `E2E企業-${Date.now()}`
  await apiPost(page, '/companies/', {
    name: companyName,
    industry: 'テクノロジー',
    contact_person_name: '担当者A',
    contact_email: 'company@example.com',
  })

  const list = await apiGet(page, '/companies/', {
    search: companyName,
    page_size: '1',
  })

  const company = extractFirstMatch(list, (item) => item.name === companyName)
  expect(company, `作成した企業「${companyName}」が一覧から取得できません`).toBeTruthy()
  return company as { id: number; name: string }
}

test.describe('NGリスト管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30_000 })
  })

  test('CSVインポートからNG追加・削除フロー', async ({ page }) => {
    const client = await createClient(page)
    const matchedCompany = await createCompany(page, `E2E-NG-Matched-${Date.now()}`)
    const unmatchedName = `E2E-NG-Unmatched-${Date.now()}`

    const csvPath = path.join(process.cwd(), `tmp-ng-import-${Date.now()}.csv`)
    const csvContent = `企業名,理由\n${matchedCompany.name},既存企業のため除外\n${unmatchedName},クライアント指定NG\n`
    fs.writeFileSync(csvPath, csvContent, 'utf-8')

    try {
      await page.goto(`/clients/${client.id}`)
      await expect(page.getByRole('tab', { name: 'NGリスト' })).toBeVisible({ timeout: 30_000 })
      await page.getByRole('tab', { name: 'NGリスト' }).click()

      const fileInput = page.locator('input[type="file"][accept*=".csv"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.getByText('インポート完了', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
      await expect(page.getByRole('table')).toContainText(matchedCompany.name)
      await expect(page.getByRole('table')).toContainText(unmatchedName)

      const matchedRow = page.locator('table tbody tr', { hasText: matchedCompany.name }).first()
      page.once('dialog', (dialog) => dialog.accept())
      await matchedRow
        .getByRole('button', { name: `${matchedCompany.name}をNGリストから削除` })
        .click()

      await expect(page.getByText('削除完了')).toBeVisible()
    } finally {
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath)
      }
    }
  })

  test('企業検索からNG追加', async ({ page }) => {
    const client = await createClient(page)
    const company = await createCompany(page, `E2E-NG-Search-${Date.now()}`)

    await page.goto(`/clients/${client.id}`)
    await expect(page.getByRole('tab', { name: 'NGリスト' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('tab', { name: 'NGリスト' }).click()
    await page.getByRole('button', { name: '企業検索' }).click()

    const searchInput = page.getByPlaceholder('企業名を入力してください...')
    await searchInput.fill(company.name)
    const resultRow = page.locator('table tbody tr', { hasText: company.name }).first()
    await expect(resultRow).toBeVisible({ timeout: 10000 })

    await resultRow.click()
    await page.getByLabel('NG理由 *').fill('テスト用のNG登録')
    await page.getByRole('button', { name: 'NGリストに追加' }).click()

    await expect(page.getByText('追加完了', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('table')).toContainText(company.name)
    await expect(page.getByRole('table')).toContainText('テスト用のNG登録')
  })

  test('NG統計のマッチ/未マッチ表示確認', async ({ page }) => {
    const client = await createClient(page)
    const matchedCompany = await createCompany(page, `E2E-NG-Stat-Matched-${Date.now()}`)
    const unmatchedName = `E2E-NG-Stat-Unmatched-${Date.now()}`

    const csvPath = path.join(process.cwd(), `tmp-ng-stats-${Date.now()}.csv`)
    const csvContent = `企業名,理由\n${matchedCompany.name},既存企業NG\n${unmatchedName},未マッチ企業NG\n`
    fs.writeFileSync(csvPath, csvContent, 'utf-8')

    try {
      await page.goto(`/clients/${client.id}`)
      await expect(page.getByRole('tab', { name: 'NGリスト' })).toBeVisible({ timeout: 30_000 })
      await page.getByRole('tab', { name: 'NGリスト' }).click()

      const fileInput = page.locator('input[type="file"][accept*=".csv"]')
      await fileInput.setInputFiles(csvPath)
      await expect(page.getByText('インポート完了', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

      await expect(page.getByText(/マッチ済: 1/)).toBeVisible()
      await expect(page.getByText(/未マッチ: 1/)).toBeVisible()
      await expect(page.getByRole('table')).toContainText('マッチ済')
      await expect(page.getByRole('table')).toContainText('未マッチ')
    } finally {
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath)
      }
    }
  })
})
