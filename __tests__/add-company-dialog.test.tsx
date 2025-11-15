/**
 * AddCompanyDialog Component Tests
 * 
 * 案件に企業を追加するダイアログのテスト
 * - 全列（担当者、Facebook、売上、所在地、ステータス）の表示確認
 * - 各列の表示形式確認
 * - 未設定の場合の表示確認
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddCompanyDialog } from '@/components/projects/add-company-dialog'
import type { Company } from '@/lib/types'

// Mock hooks
jest.mock('@/hooks/use-companies', () => ({
  useCompanies: jest.fn(),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const { useCompanies } = require('@/hooks/use-companies')

const mockOnAddCompanies = jest.fn().mockResolvedValue(undefined)
const mockOnOpenChange = jest.fn()

const createMockCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 1,
  name: 'テスト株式会社',
  industry: 'IT・ソフトウェア',
  employee_count: 100,
  revenue: 1000000000,
  prefecture: '東京都',
  contact_person_name: '田中太郎',
  contact_person_position: '営業部長',
  facebook_url: 'https://facebook.com/test',
  status: 'active',
  website_url: 'https://test.com',
  contact_email: 'test@test.com',
  phone: '03-1234-5678',
  notes: '',
  is_global_ng: false,
  established_year: 2020,
  city: '渋谷区',
  ...overrides,
})

describe('AddCompanyDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAddCompanies.mockClear()
    mockOnOpenChange.mockClear()
  })

  describe('全列の表示確認', () => {
    it('テーブルヘッダーに全列が表示される', async () => {
      useCompanies.mockReturnValue({
        companies: [createMockCompany()],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('企業名')).toBeInTheDocument()
        expect(screen.getByText('担当者')).toBeInTheDocument()
        expect(screen.getAllByText('Facebook').length).toBeGreaterThan(0)
        expect(screen.getByText('業界')).toBeInTheDocument()
        expect(screen.getByText('従業員数')).toBeInTheDocument()
        expect(screen.getByText('売上')).toBeInTheDocument()
        expect(screen.getByText('所在地')).toBeInTheDocument()
        expect(screen.getByText('ステータス')).toBeInTheDocument()
      })
    })

    it('テーブルボディに全列のデータが表示される', async () => {
      const company = createMockCompany()
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
        expect(screen.getByText('営業部長')).toBeInTheDocument()
        expect(screen.getAllByText('Facebook').length).toBeGreaterThan(0)
        expect(screen.getByText('IT・ソフトウェア')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        // 通貨形式は環境によって異なる可能性があるため、部分一致で確認
        const revenueTexts = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('1,000,000,000') || false
        })
        expect(revenueTexts.length).toBeGreaterThan(0)
        expect(screen.getByText('東京都')).toBeInTheDocument()
        expect(screen.getByText('アクティブ')).toBeInTheDocument()
      })
    })
  })

  describe('担当者列の表示', () => {
    it('担当者名と役職が2行で表示される', async () => {
      const company = createMockCompany({
        contact_person_name: '山田花子',
        contact_person_position: 'マーケティング部長',
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('山田花子')).toBeInTheDocument()
        expect(screen.getByText('マーケティング部長')).toBeInTheDocument()
      })
    })

    it('担当者が未設定の場合は「未設定」と表示される', async () => {
      const company = createMockCompany({
        contact_person_name: undefined,
        contact_person_position: undefined,
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        const unsetTexts = screen.getAllByText('未設定')
        expect(unsetTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Facebook列の表示', () => {
    it('Facebook URLが設定されている場合はリンクとして表示される', async () => {
      const company = createMockCompany({
        facebook_url: 'https://facebook.com/test-company',
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        const links = screen.getAllByText('Facebook')
        const linkElement = links.find(link => link.closest('a'))
        expect(linkElement).toBeInTheDocument()
        const link = linkElement?.closest('a')
        expect(link).toHaveAttribute('href', 'https://facebook.com/test-company')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })

    it('Facebook URLが未設定の場合は「未設定」と表示される', async () => {
      const company = createMockCompany({
        facebook_url: undefined,
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        const unsetTexts = screen.getAllByText('未設定')
        expect(unsetTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('売上列の表示', () => {
    it('売上が通貨形式でフォーマットされて表示される', async () => {
      const company = createMockCompany({
        revenue: 5000000,
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        // 通貨形式は環境によって異なる可能性があるため、部分一致で確認
        const revenueTexts = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('5,000,000') || false
        })
        expect(revenueTexts.length).toBeGreaterThan(0)
      })
    })

    it('売上が未設定の場合は「-」と表示される', async () => {
      const company = createMockCompany({
        revenue: null,
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        const dashes = screen.getAllByText('-')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('所在地列の表示', () => {
    it('都道府県が表示される', async () => {
      const company = createMockCompany({
        prefecture: '大阪府',
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('大阪府')).toBeInTheDocument()
      })
    })

    it('所在地が未設定の場合は「-」と表示される', async () => {
      const company = createMockCompany({
        prefecture: undefined,
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        const dashes = screen.getAllByText('-')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('ステータス列の表示', () => {
    it('ステータスがバッジ形式で表示される', async () => {
      const company = createMockCompany({
        status: 'prospect',
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('見込み客')).toBeInTheDocument()
      })
    })

    it('ステータスが未設定の場合はデフォルトで「アクティブ」と表示される', async () => {
      const company = createMockCompany({
        status: undefined,
      })
      useCompanies.mockReturnValue({
        companies: [company],
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('アクティブ')).toBeInTheDocument()
      })
    })

    it('各ステータスが正しく表示される', async () => {
      const companies = [
        createMockCompany({ id: 1, status: 'active' }),
        createMockCompany({ id: 2, status: 'prospect' }),
        createMockCompany({ id: 3, status: 'inactive' }),
      ]
      useCompanies.mockReturnValue({
        companies,
        isLoading: false,
        error: null,
      })

      render(
        <AddCompanyDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onAddCompanies={mockOnAddCompanies}
          existingCompanyIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('アクティブ')).toBeInTheDocument()
        expect(screen.getByText('見込み客')).toBeInTheDocument()
        expect(screen.getByText('非アクティブ')).toBeInTheDocument()
      })
    })
  })
})

