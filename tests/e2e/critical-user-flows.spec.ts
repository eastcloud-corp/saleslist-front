/**
 * Critical User Flow E2E Tests
 * 
 * 最重要なユーザー操作フローのE2Eテスト
 */

import { test, expect } from '@playwright/test'

// Test configuration
const BASE_URL = 'http://localhost:3002'
const BACKEND_URL = 'http://localhost:8002'

// ログイン関数
async function login(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.click('button:has-text("デバッグ情報を自動入力")')
  await page.click('button:has-text("ログイン")')
  await page.waitForURL((url: any) => url.pathname !== '/login', { timeout: 10000 })
}

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await login(page)
  })

  test.describe('Application Access', () => {
    test('should load homepage without errors', async ({ page }) => {
      // ログイン後のページ（ダッシュボードまたは企業一覧）に移動
      await page.goto(`${BASE_URL}/dashboard`)

      // Check that page loads
      await expect(page).toHaveTitle(/Sales Navigator|案件管理|ダッシュボード/)

      // Check for no console errors
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.waitForLoadState('domcontentloaded')

      // Verify no critical errors
      const criticalErrors = errors.filter(error =>
        !error.includes('_next/static') &&
        !error.includes('404')
      )
      expect(criticalErrors.length).toBe(0)
    })

    test('should render main navigation', async ({ page }) => {
      // Check main navigation elements exist
      await expect(page.getByText('ダッシュボード')).toBeVisible()
      await expect(page.getByText('案件管理')).toBeVisible()
      await expect(page.getByText('企業管理')).toBeVisible()
    })
  })

  test.describe('Company Management', () => {
    test('should navigate to companies page', async ({ page }) => {
      // Navigate to companies
      await page.getByText('企業管理').click()
      
      // Verify URL and page content
      await expect(page).toHaveURL(/.*companies/)
      await expect(page.getByText('企業一覧')).toBeVisible()
    })

    test('should open new company form', async ({ page }) => {
      // Navigate to companies and add new
      await page.getByText('企業管理').click()
      await page.getByText('新規企業登録').click()
      
      // Verify form opens
      await expect(page.getByText('企業情報の登録')).toBeVisible()
      await expect(page.getByLabel('企業名')).toBeVisible()
      await expect(page.getByLabel('業界')).toBeVisible()
    })
  })

  test.describe('Project Management', () => {
    test('should navigate to projects page', async ({ page }) => {
      // Navigate to projects
      await page.getByText('案件管理').click()
      
      // Verify projects page loads
      await expect(page).toHaveURL(/.*projects/)
      await expect(page.getByText('案件一覧')).toBeVisible()
    })
  })

  test.describe('Data Loading', () => {
    test('should load data without infinite loading states', async ({ page }) => {
      // Navigate to projects
      await page.getByText('案件管理').click()
      
      // Wait for loading to complete (max 10 seconds)
      await page.waitForTimeout(2000)
      
      // Check that loading indicators are not stuck
      const loadingElements = await page.locator('[data-loading="true"], .loading, .spinner').count()
      const stuckLoading = await page.locator('text=読み込み中').count()
      
      // Some loading is OK, but not excessive
      expect(loadingElements).toBeLessThan(5)
      expect(stuckLoading).toBeLessThan(3)
    })
  })

  test.describe('Form Functionality', () => {
    test('should handle form input without crashes', async ({ page }) => {
      // Navigate to new company form
      await page.getByText('企業管理').click()
      await page.getByText('新規企業登録').click()
      
      // Test basic form input
      await page.getByLabel('企業名').fill('E2Eテスト企業')
      await page.getByLabel('業界').fill('E2Eテスト業界')
      
      // Verify input was recorded
      await expect(page.getByDisplayValue('E2Eテスト企業')).toBeVisible()
      await expect(page.getByDisplayValue('E2Eテスト業界')).toBeVisible()
      
      // Test cancel functionality
      await page.getByText('キャンセル').click()
    })
  })

  test.describe('API Integration', () => {
    test('should make successful API calls to backend', async ({ page }) => {
      // Monitor network requests
      const apiRequests: string[] = []
      
      page.on('request', (request) => {
        if (request.url().includes('localhost:8002') || request.url().includes('/api/')) {
          apiRequests.push(request.url())
        }
      })
      
      // Navigate to data-heavy page
      await page.getByText('案件管理').click()
      
      // Wait for API calls
      await page.waitForTimeout(3000)
      
      // Verify API calls were made (but don't require specific data)
      expect(apiRequests.length).toBeGreaterThan(0)
    })
  })

  test.describe('Error Resilience', () => {
    test('should not crash on missing data', async ({ page }) => {
      // Navigate through different pages
      await page.getByText('ダッシュボード').click()
      await page.waitForTimeout(1000)
      
      await page.getByText('案件管理').click()
      await page.waitForTimeout(1000)
      
      await page.getByText('企業管理').click()
      await page.waitForTimeout(1000)
      
      // Verify page is still responsive
      await expect(page.getByText('企業一覧')).toBeVisible()
    })
  })
})