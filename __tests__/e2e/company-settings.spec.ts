import { test, expect } from "@playwright/test"

test.describe("Company Settings", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto("/settings")

    // Click on System Settings tab
    await page.click('[data-testid="system-tab"]')
  })

  test("should display company settings form with all fields", async ({ page }) => {
    // Check if all form fields are visible
    await expect(page.locator('input[id="company_name"]')).toBeVisible()
    await expect(page.locator('input[id="ceo_name"]')).toBeVisible()
    await expect(page.locator('input[id="established_year"]')).toBeVisible()
    await expect(page.locator('input[id="employee_count"]')).toBeVisible()
    await expect(page.locator('input[id="phone"]')).toBeVisible()
    await expect(page.locator('input[id="email"]')).toBeVisible()
    await expect(page.locator('input[id="website"]')).toBeVisible()
    await expect(page.locator('input[id="postal_code"]')).toBeVisible()
    await expect(page.locator('input[id="address"]')).toBeVisible()
    await expect(page.locator('textarea[id="description"]')).toBeVisible()

    // Check buttons
    await expect(page.locator('button:has-text("設定を保存")')).toBeVisible()
    await expect(page.locator('button:has-text("リセット")')).toBeVisible()
  })

  test("should validate required fields", async ({ page }) => {
    // Try to save without filling required fields
    await page.click('button:has-text("設定を保存")')

    // Check if validation error appears
    await expect(page.locator('text=会社名は必須です')).toBeVisible()
  })

  test("should validate email format", async ({ page }) => {
    // Fill company name (required field)
    await page.fill('input[id="company_name"]', "テスト株式会社")

    // Enter invalid email
    await page.fill('input[id="email"]', "invalid-email")

    // Try to save
    await page.click('button:has-text("設定を保存")')

    // Check if validation error appears
    await expect(page.locator('text=無効なメール形式です')).toBeVisible()
  })

  test("should validate website format", async ({ page }) => {
    // Fill company name (required field)
    await page.fill('input[id="company_name"]', "テスト株式会社")

    // Enter invalid website
    await page.fill('input[id="website"]', "invalid-website")

    // Try to save
    await page.click('button:has-text("設定を保存")')

    // Check if validation error appears
    await expect(page.locator('text=ウェブサイトはhttp://またはhttps://で始まる必要があります')).toBeVisible()
  })

  test("should validate phone number format", async ({ page }) => {
    // Fill company name (required field)
    await page.fill('input[id="company_name"]', "テスト株式会社")

    // Enter invalid phone number
    await page.fill('input[id="phone"]', "invalid-phone")

    // Try to save
    await page.click('button:has-text("設定を保存")')

    // Check if validation error appears
    await expect(page.locator('text=無効な電話番号形式です')).toBeVisible()
  })

  test("should validate postal code format", async ({ page }) => {
    // Fill company name (required field)
    await page.fill('input[id="company_name"]', "テスト株式会社")

    // Enter invalid postal code
    await page.fill('input[id="postal_code"]', "12345")

    // Try to save
    await page.click('button:has-text("設定を保存")')

    // Check if validation error appears
    await expect(page.locator('text=郵便番号は000-0000の形式で入力してください')).toBeVisible()
  })

  test("should save company settings successfully", async ({ page }) => {
    // Fill all form fields with valid data
    await page.fill('input[id="company_name"]', "テスト株式会社")
    await page.fill('input[id="ceo_name"]', "田中太郎")
    await page.fill('input[id="established_year"]', "2020")
    await page.fill('input[id="employee_count"]', "50")
    await page.fill('input[id="phone"]', "03-1234-5678")
    await page.fill('input[id="email"]', "test@example.com")
    await page.fill('input[id="website"]', "https://example.com")
    await page.fill('input[id="postal_code"]', "123-4567")
    await page.fill('input[id="address"]', "東京都渋谷区1-1-1")
    await page.fill('textarea[id="description"]', "テスト会社の概要です")

    // Save the form
    await page.click('button:has-text("設定を保存")')

    // Check for success message
    await expect(page.locator('text=設定を保存しました')).toBeVisible()
  })

  test("should reset form when reset button is clicked", async ({ page }) => {
    // Fill some form fields
    await page.fill('input[id="company_name"]', "テスト株式会社")
    await page.fill('input[id="phone"]', "03-1234-5678")

    // Click reset button
    await page.click('button:has-text("リセット")')

    // Check if form is reset
    await expect(page.locator('input[id="company_name"]')).toHaveValue("")
    await expect(page.locator('input[id="phone"]')).toHaveValue("")

    // Check for reset message
    await expect(page.locator('text=設定をリセットしました')).toBeVisible()
  })

  test("should preserve form data after page reload", async ({ page }) => {
    // Fill and save form data
    await page.fill('input[id="company_name"]', "テスト株式会社")
    await page.fill('input[id="phone"]', "03-1234-5678")
    await page.fill('input[id="email"]', "test@example.com")

    // Save the form
    await page.click('button:has-text("設定を保存")')

    // Wait for success message
    await expect(page.locator('text=設定を保存しました')).toBeVisible()

    // Reload the page
    await page.reload()

    // Click on System Settings tab again
    await page.click('[data-testid="system-tab"]')

    // Check if data is preserved
    await expect(page.locator('input[id="company_name"]')).toHaveValue("テスト株式会社")
    await expect(page.locator('input[id="phone"]')).toHaveValue("03-1234-5678")
    await expect(page.locator('input[id="email"]')).toHaveValue("test@example.com")
  })

  test("should clear validation errors when fields are corrected", async ({ page }) => {
    // Fill company name (required field)
    await page.fill('input[id="company_name"]', "テスト株式会社")

    // Enter invalid email to trigger validation error
    await page.fill('input[id="email"]', "invalid-email")
    await page.click('button:has-text("設定を保存")')

    // Check if validation error appears
    await expect(page.locator('text=無効なメール形式です')).toBeVisible()

    // Correct the email
    await page.fill('input[id="email"]', "test@example.com")

    // Wait a moment for the error to clear
    await page.waitForTimeout(500)

    // Check if validation error is cleared
    await expect(page.locator('text=無効なメール形式です')).not.toBeVisible()
  })

  test("should disable form fields while saving", async ({ page }) => {
    // Fill required field
    await page.fill('input[id="company_name"]', "テスト株式会社")

    // Start saving
    await page.click('button:has-text("設定を保存")')

    // Check if button text changes to "保存中..."
    await expect(page.locator('button:has-text("保存中...")')).toBeVisible()

    // Check if form fields are disabled during save
    await expect(page.locator('input[id="company_name"]')).toBeDisabled()
  })

  test("should handle numeric field inputs correctly", async ({ page }) => {
    // Test established year field
    await page.fill('input[id="established_year"]', "2023")
    await expect(page.locator('input[id="established_year"]')).toHaveValue("2023")

    // Test employee count field
    await page.fill('input[id="employee_count"]', "100")
    await expect(page.locator('input[id="employee_count"]')).toHaveValue("100")

    // Test that negative numbers are handled properly
    await page.fill('input[id="employee_count"]', "-10")
    await page.fill('input[id="company_name"]', "テスト株式会社")
    await page.click('button:has-text("設定を保存")')

    // Should show validation error for negative employee count
    await expect(page.locator('text=従業員数は正の数である必要があります')).toBeVisible()
  })
})