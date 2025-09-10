/**
 * 案件-企業管理E2Eテスト
 * 今回発見された問題のテストカバレッジ
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3009'

test.describe('案件-企業管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // ログイン後のリダイレクト先を柔軟に待機
    await page.waitForFunction(() => {
      return window.location.pathname !== '/login'
    }, { timeout: 10000 })
  })

  test('案件に企業追加→表示確認フロー', async ({ page }) => {
    // 1. プロジェクト一覧に移動
    await page.goto(`${BASE_URL}/projects`)
    await expect(page.getByText('案件管理')).toBeVisible()
    
    // 2. 最初のプロジェクトの詳細を開く
    await page.click('text=詳細', { timeout: 10000 })
    
    // 3. 企業追加ボタンをクリック
    await page.click('text=企業追加', { timeout: 10000 })
    
    // 4. 企業選択画面での企業追加
    await page.waitForSelector('table', { timeout: 10000 })
    
    // 最初の企業にチェック
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    await firstCheckbox.check()
    
    // 追加ボタンクリック
    await page.click('text=選択した企業を追加')
    
    // 5. プロジェクト詳細に戻って企業表示確認
    await page.waitForURL(`${BASE_URL}/projects/*`, { timeout: 10000 })
    
    // 企業テーブルが存在することを確認
    await expect(page.locator('table')).toBeVisible()
    
    // 企業名が表示されていることを確認（今回の問題対象）
    const companyRows = page.locator('tbody tr')
    await expect(companyRows.first()).toBeVisible()
    
    // 企業名セルをチェック（空でない）
    const companyNameCell = companyRows.first().locator('td').first()
    const companyNameText = await companyNameCell.textContent()
    expect(companyNameText).not.toBe('')
    expect(companyNameText).not.toBe('企業名不明')
    
    console.log(`企業表示確認: ${companyNameText}`)
  })

  test('企業is_activeトグル機能テスト', async ({ page }) => {
    // 企業が既に追加されているプロジェクトに移動
    await page.goto(`${BASE_URL}/projects/6`) // テストプロジェクトID
    
    // 企業テーブル確認
    await expect(page.locator('table')).toBeVisible()
    
    // is_activeスイッチを探す
    const activeSwitch = page.locator('input[role="switch"]').first()
    await expect(activeSwitch).toBeVisible()
    
    // 現在の状態取得
    const isChecked = await activeSwitch.isChecked()
    
    // トグル実行
    await activeSwitch.click()
    
    // 変更確認（少し待機）
    await page.waitForTimeout(1000)
    
    // 状態が変更されたことを確認
    const newState = await activeSwitch.isChecked()
    expect(newState).toBe(!isChecked)
    
    // トーストメッセージ確認
    await expect(page.getByText(/有効化|無効化/)).toBeVisible()
  })

  test('営業ステータス更新フロー', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects/6`)
    
    // ステータスセレクトを探す
    const statusSelect = page.locator('select, [role="combobox"]').first()
    await expect(statusSelect).toBeVisible()
    
    // ステータス変更
    await statusSelect.click()
    await page.click('text=DM送信予定')
    
    // 変更確認
    await page.waitForTimeout(1000)
    await expect(page.getByText('DM送信予定')).toBeVisible()
  })

  test('マスターデータ選択機能テスト', async ({ page }) => {
    // 案件作成画面でマスターデータ選択をテスト
    await page.goto(`${BASE_URL}/projects`)
    await page.click('text=新規案件作成')
    
    // 進行状況ステータス選択
    const progressSelect = page.locator('select[name="progress_status"], [name="progress_status"]')
    if (await progressSelect.count() > 0) {
      await progressSelect.click()
      await expect(page.getByText('未着手')).toBeVisible()
      await page.click('text=未着手')
    }
    
    // サービス種別選択
    const serviceSelect = page.locator('select[name="service_type"], [name="service_type"]')
    if (await serviceSelect.count() > 0) {
      await serviceSelect.click()
      await expect(page.getByText('コンサルティング')).toBeVisible()
    }
  })

  test('企業一覧からプロジェクト追加フロー', async ({ page }) => {
    // 企業一覧に移動
    await page.goto(`${BASE_URL}/companies`)
    
    // 企業詳細を開く
    await page.click('text=詳細', { timeout: 10000 })
    
    // この企業を案件に追加するボタンがあるかチェック
    const addToProjectButton = page.getByText('案件に追加')
    if (await addToProjectButton.count() > 0) {
      await addToProjectButton.click()
      
      // 案件選択ダイアログ
      await expect(page.getByText('案件を選択')).toBeVisible()
    }
  })
})