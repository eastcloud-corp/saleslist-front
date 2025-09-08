/**
 * CompanyForm Component Tests
 * 
 * 重要な企業フォーム機能のテスト
 * - フィールド入力
 * - バリデーション
 * - 送信処理
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompanyForm } from '@/components/companies/company-form'
import type { Company } from '@/lib/types'

// Mock hooks that might not resolve in test environment
jest.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

const mockOnSave = jest.fn()
const mockOnCancel = jest.fn()

const mockCompany: Partial<Company> = {
  id: 1,
  name: 'テスト株式会社',
  industry: 'テクノロジー',
  corporate_number: '1234567890123',
  contact_person_name: '田中太郎',
  contact_person_position: '営業部長',
  facebook_url: 'https://facebook.com/test',
  tob_toc_type: 'toB',
  business_description: 'テスト事業',
  description: 'テスト企業です',
  prefecture: '東京都',
  city: '渋谷区',
  location: '1-1-1 テストビル',
  employee_count: 100,
  revenue: 100000000,
  capital: 10000000,
  established_year: 2020,
  website_url: 'https://test.com',
  contact_email: 'test@test.com',
  phone: '03-1234-5678',
  notes: 'テストメモ',
  status: 'active',
  is_global_ng: false
}

describe('CompanyForm', () => {
  beforeEach(() => {
    mockOnSave.mockClear()
    mockOnCancel.mockClear()
  })

  describe('新規作成モード', () => {
    it('should render all required fields for new company', () => {
      render(
        <CompanyForm onSave={mockOnSave} onCancel={mockOnCancel} />
      )

      // 必須フィールド確認
      expect(screen.getByLabelText(/企業名/)).toBeInTheDocument()
      expect(screen.getByLabelText(/業界/)).toBeInTheDocument()
      expect(screen.getByText('新規企業登録')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      
      render(
        <CompanyForm onSave={mockOnSave} onCancel={mockOnCancel} />
      )

      // 空のまま保存ボタンクリック
      await user.click(screen.getByText('変更を保存'))

      // バリデーションエラー確認
      await waitFor(() => {
        expect(screen.getByText('企業名は必須です')).toBeInTheDocument()
        expect(screen.getByText('業界は必須です')).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should save new company with valid data', async () => {
      const user = userEvent.setup()
      
      render(
        <CompanyForm onSave={mockOnSave} onCancel={mockOnCancel} />
      )

      // フォーム入力
      await user.type(screen.getByLabelText(/企業名/), '新規テスト企業')
      await user.type(screen.getByLabelText(/業界/), 'AI・機械学習')
      await user.type(screen.getByLabelText(/従業員数/), '50')
      await user.type(screen.getByLabelText(/メールアドレス/), 'test@newcompany.com')

      // 保存
      await user.click(screen.getByText('変更を保存'))

      // 保存データ確認
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '新規テスト企業',
            industry: 'AI・機械学習',
            employee_count: 50,
            contact_email: 'test@newcompany.com'
          })
        )
      })
    })
  })

  describe('編集モード', () => {
    it('should populate all fields with existing company data', () => {
      render(
        <CompanyForm 
          company={mockCompany as Company}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      // データ自動入力確認
      expect(screen.getByDisplayValue('テスト株式会社')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テクノロジー')).toBeInTheDocument()
      expect(screen.getByDisplayValue('田中太郎')).toBeInTheDocument()
      expect(screen.getByDisplayValue('営業部長')).toBeInTheDocument()
      expect(screen.getByDisplayValue('東京都')).toBeInTheDocument()
      expect(screen.getByDisplayValue('渋谷区')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テストメモ')).toBeInTheDocument()
      
      expect(screen.getByText('企業情報の編集')).toBeInTheDocument()
    })

    it('should preserve data when editing fields', async () => {
      const user = userEvent.setup()
      
      render(
        <CompanyForm 
          company={mockCompany as Company}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      // 業界フィールド編集（データが消えないことを確認）
      const industryField = screen.getByDisplayValue('テクノロジー')
      await user.clear(industryField)
      await user.type(industryField, 'フィンテック')

      // 他のデータが保持されていることを確認
      expect(screen.getByDisplayValue('テスト株式会社')).toBeInTheDocument()
      expect(screen.getByDisplayValue('田中太郎')).toBeInTheDocument()
      expect(screen.getByDisplayValue('フィンテック')).toBeInTheDocument()
    })
  })

  describe('バリデーション', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup()
      
      render(
        <CompanyForm onSave={mockOnSave} onCancel={mockOnCancel} />
      )

      await user.type(screen.getByLabelText(/企業名/), 'テスト企業')
      await user.type(screen.getByLabelText(/業界/), 'IT')
      await user.type(screen.getByLabelText(/メールアドレス/), 'invalid-email')
      
      await user.click(screen.getByText('変更を保存'))

      await waitFor(() => {
        expect(screen.getByText('無効なメール形式です')).toBeInTheDocument()
      })
    })

    it('should validate website URL format', async () => {
      const user = userEvent.setup()
      
      render(
        <CompanyForm onSave={mockOnSave} onCancel={mockOnCancel} />
      )

      await user.type(screen.getByLabelText(/企業名/), 'テスト企業')
      await user.type(screen.getByLabelText(/業界/), 'IT')
      await user.type(screen.getByLabelText(/ウェブサイト/), 'invalid-url')
      
      await user.click(screen.getByText('変更を保存'))

      await waitFor(() => {
        expect(screen.getByText(/ウェブサイトはhttp/)).toBeInTheDocument()
      })
    })
  })

  describe('フォーム操作', () => {
    it('should handle cancel button', async () => {
      const user = userEvent.setup()
      
      render(
        <CompanyForm onSave={mockOnSave} onCancel={mockOnCancel} />
      )

      await user.click(screen.getByText('キャンセル'))
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should handle loading state', () => {
      render(
        <CompanyForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
          isLoading={true}
        />
      )

      expect(screen.getByText('保存中...')).toBeInTheDocument()
    })
  })
})