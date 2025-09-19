import { test, expect } from '@playwright/test'
import {
  createAuthenticatedContext,
  createClient,
  createCompany,
  deleteResource,
} from '../helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'salesnav_admin@budget-sales.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'salesnav20250901'

async function login(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'デバッグ情報を自動入力' }).click()
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForLoadState('networkidle')
}

test.describe('CSVインポート', () => {
  const templateCsv = `Company Name,Industry,Employee Count,Revenue (¥),Location,Website,Phone,Email,Description,Status\n`
    + `テンプレート株式会社,Technology,50,1000000,Tokyo,https://template.co.jp,03-0000-0000,info@template.co.jp,サンプル企業,active\n`

  test('企業CSVをインポートできる', async ({ page }) => {
    await login(page)
    await page.goto('/companies', { waitUntil: 'networkidle' })

    const openDialogButton = page.getByRole('button', { name: 'CSV インポート' })
    await openDialogButton.scrollIntoViewIfNeeded()
    await openDialogButton.click()

    await page.setInputFiles('input[type="file"]', {
      name: 'companies-template.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(templateCsv, 'utf-8'),
    })

    await expect(page.locator('text=/CSVの検証が完了しました|CSV file validated successfully|Ready to import/').first()).toBeVisible({ timeout: 15000 })
    const startImportButton = page.getByRole('button', { name: /インポート開始|Import \d+ Companies/ })
    const nextButton = page.getByRole('button', { name: /インポートへ進む|Next/ })
    if (await startImportButton.isVisible().catch(() => false)) {
      await startImportButton.click()
    } else {
      await nextButton.click()
      await startImportButton.click()
    }

    await expect(page.locator('text=/インポートが完了しました|Import Complete!/').first()).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: /閉じる|Close/ }).first().click()

    await page.getByLabel('企業検索').fill('テンプレート株式会社')
    await expect(page.getByRole('row', { name: /テンプレート株式会社/ }).first()).toBeVisible({ timeout: 15000 })
  })

  test.describe('クライアントNGリスト CSV', () => {
    let adminApi: Awaited<ReturnType<typeof createAuthenticatedContext>>['context']
    let clientId = 0

    const buildCsv = (companyName: string, reason: string) => `企業名,理由\n${companyName},${reason}\n`

    test.beforeAll(async () => {
      const auth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
      adminApi = auth.context
      const unique = Date.now()
      const client = await createClient(adminApi, {
        name: `NGリストCSVクライアント-${unique}`,
        industry: 'IT・ソフトウェア',
        contact_email: `ng-client-${unique}@example.com`,
      })
      clientId = client.id
    })

    test.afterAll(async () => {
      if (clientId) {
        await deleteResource(adminApi, `/clients/${clientId}/`)
      }
      await adminApi?.dispose()
    })

    test('NGリストにCSVで企業を登録できる', async ({ page }) => {
      await login(page)

      await page.goto(`/clients/${clientId}`)
      await page.waitForLoadState('networkidle')
      await page.getByRole('tab', { name: 'NGリスト' }).click()

      const companyName = `CSV取込企業-${Date.now()}`
      await page.setInputFiles('input#csv-import', {
        name: 'ng-list.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(buildCsv(companyName, '競合企業'), 'utf-8'),
      })

      await expect(page.locator('text=/インポート完了/').first()).toBeVisible({ timeout: 15000 })
      await expect(page.getByRole('row', { name: new RegExp(companyName) })).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('役員 CSV', () => {
    let adminApi: Awaited<ReturnType<typeof createAuthenticatedContext>>['context']
    let companyId = 0
    let companyName = ''
    let executiveId: number | null = null

    const buildExecutiveCsv = (companyName: string) => `company_name,name,position,facebook_url,other_sns_url,direct_email,notes\n${companyName},山田太郎,CEO,https://facebook.com/taro,,taro@example.com,メモ\n`

    test.beforeAll(async () => {
      const auth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
      adminApi = auth.context
      const unique = Date.now()
      companyName = `役員CSV企業-${unique}`
      const company = await createCompany(adminApi, {
        name: companyName,
        industry: 'IT・ソフトウェア',
        prefecture: '東京都',
        city: '港区',
        employee_count: 200,
        revenue: 9000000,
        established_year: 2010,
        website_url: 'https://executive-company.example.com',
        contact_email: 'info@executive-company.example.com',
        phone: '03-0000-9999',
      })
      companyId = company.id
    })

    test.afterAll(async () => {
      if (executiveId) {
        await deleteResource(adminApi, `/executives/${executiveId}/`)
      }
      if (companyId) {
        await deleteResource(adminApi, `/companies/${companyId}/`)
      }
      await adminApi?.dispose()
    })

    test('役員CSVをインポートして完了画面が表示される', async ({ page }) => {
      await login(page)

      await page.goto('/executives')
    await page.getByRole('button', { name: 'CSVインポート' }).click()

    const csvBuffer = Buffer.from(buildExecutiveCsv(companyName), 'utf-8')
    await page.setInputFiles('input#csv-file', {
      name: 'executives.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer,
    })
      const importButton = page.getByRole('button', { name: /インポート実行|Import CSV/ })
    if (await importButton.isVisible().catch(() => false)) {
      await importButton.click()
      await expect(page.getByText('役員データのインポートが完了しました')).toBeVisible({ timeout: 20000 })

      const response = await adminApi.get('/api/v1/executives/?ordering=-id')
      const data = await response.json()
      const created = data.results?.find((item: any) => item.name === '山田太郎' && item.company_name === companyName)
      expect(created).toBeTruthy()
      executiveId = created?.id ?? null

      await page.getByRole('button', { name: '閉じる' }).click()
    } else {
      await expect(page.getByText('インポート完了')).toBeVisible({ timeout: 20000 })
      await page.getByRole('button', { name: '閉じる' }).click()
    }
    })
  })
})
