/**
 * AddCompaniesClient Component Tests
 * 
 * 案件に企業を追加する画面のテスト
 * - テーブル形式への変更確認
 * - 全列（担当者、Facebook、売上、所在地、ステータス）の表示確認
 * - 各列の表示形式確認
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddCompaniesClient } from '@/app/projects/[id]/add-companies/add-companies-client'
import type { Company, Project } from '@/lib/types'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/projects/1/add-companies',
}))

// Mock hooks
jest.mock('@/hooks/use-projects', () => ({
  useProject: jest.fn(),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
    isLoading: false,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const { useProject } = require('@/hooks/use-projects')

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
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 1,
  name: 'テスト案件',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('AddCompaniesClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('テーブル形式の表示確認', () => {
    it('テーブル形式で企業リストが表示される', async () => {
      const project = createMockProject()
      const companies = [createMockCompany()]
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: companies,
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        expect(screen.getByText('企業名')).toBeInTheDocument()
        expect(screen.getByTestId('table-header-contact')).toBeInTheDocument()
        expect(screen.getByTestId('table-header-facebook')).toBeInTheDocument()
        expect(screen.getByTestId('table-header-industry')).toBeInTheDocument()
        expect(screen.getByText('従業員数')).toBeInTheDocument()
        expect(screen.getByTestId('table-header-revenue')).toBeInTheDocument()
        expect(screen.getByText('所在地')).toBeInTheDocument()
        expect(screen.getByTestId('table-header-status')).toBeInTheDocument()
      })
    })

    it('テーブルボディに全列のデータが表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany()
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
        
        const contactCell = screen.getByTestId('company-1-contact')
        expect(contactCell).toBeInTheDocument()
        expect(contactCell).toHaveTextContent('田中太郎')
        expect(contactCell).toHaveTextContent('営業部長')
        
        const facebookLink = screen.getByTestId('company-1-facebook-link')
        expect(facebookLink).toBeInTheDocument()
        
        expect(screen.getByTestId('company-1-industry')).toHaveTextContent('IT・ソフトウェア')
        expect(screen.getByText('100')).toBeInTheDocument()
        
        const revenueCell = screen.getByTestId('company-1-revenue')
        expect(revenueCell.textContent).toContain('1,000,000,000')
        
        expect(screen.getByText('東京都')).toBeInTheDocument()
        
        const statusCell = screen.getByTestId('company-1-status')
        expect(statusCell).toHaveTextContent('アクティブ')
      })
    })
  })

  describe('担当者列の表示', () => {
    it('担当者名と役職が2行で表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany({
        contact_person_name: '山田花子',
        contact_person_position: 'マーケティング部長',
      })
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        const contactCell = screen.getByTestId('company-1-contact')
        expect(contactCell).toBeInTheDocument()
        expect(contactCell).toHaveTextContent('山田花子')
        expect(contactCell).toHaveTextContent('マーケティング部長')
      })
    })

    it('担当者が未設定の場合は「未設定」と表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany({
        contact_person_name: undefined,
        contact_person_position: undefined,
      })
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        const contactCell = screen.getByTestId('company-1-contact')
        expect(contactCell).toHaveTextContent('未設定')
      })
    })
  })

  describe('Facebook列の表示', () => {
    it('Facebook URLが設定されている場合はリンクとして表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany({
        facebook_url: 'https://facebook.com/test-company',
      })
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        const facebookLink = screen.getByTestId('company-1-facebook-link')
        expect(facebookLink).toBeInTheDocument()
        expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/test-company')
        expect(facebookLink).toHaveAttribute('target', '_blank')
        expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })

    it('Facebook URLが未設定の場合は「未設定」と表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany({
        facebook_url: undefined,
      })
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        const facebookCell = screen.getByTestId('company-1-facebook')
        expect(facebookCell).toHaveTextContent('未設定')
      })
    })
  })

  describe('売上列の表示', () => {
    it('売上が通貨形式でフォーマットされて表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany({
        revenue: 5000000,
      })
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        const revenueCell = screen.getByTestId('company-1-revenue')
        expect(revenueCell.textContent).toContain('5,000,000')
      })
    })

    it('売上が未設定の場合は「-」と表示される', async () => {
      const project = createMockProject()
      const company = createMockCompany({
        revenue: null,
      })
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: [company],
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        const dashes = screen.getAllByText('-')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('ステータス列の表示', () => {
    it('各ステータスが正しく表示される', async () => {
      const project = createMockProject()
      const companies = [
        createMockCompany({ id: 1, status: 'active' }),
        createMockCompany({ id: 2, status: 'prospect' }),
        createMockCompany({ id: 3, status: 'inactive' }),
      ]
      
      useProject.mockReturnValue({
        project,
        isLoading: false,
        addCompanies: jest.fn().mockResolvedValue(undefined),
        availableCompanies: companies,
        isLoadingAvailableCompanies: false,
      })

      render(<AddCompaniesClient projectId="1" />)

      await waitFor(() => {
        expect(screen.getByText('アクティブ')).toBeInTheDocument()
        expect(screen.getByText('見込み客')).toBeInTheDocument()
        expect(screen.getByText('非アクティブ')).toBeInTheDocument()
      })
    })
  })
})

