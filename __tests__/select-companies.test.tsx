/**
 * CompanySelectionPage Component Tests
 * 
 * 営業一覧画面のテスト
 * - 全列（担当者、Facebook、売上、所在地、ステータス）の表示確認
 * - 各列の表示形式確認
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompanySelectionPage from '@/app/clients/[id]/select-companies/page'
import type { Company, Client } from '@/lib/types'

// Mock Next.js router and params
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: '1',
  }),
  usePathname: () => '/clients/1/select-companies',
}))

// Mock hooks
jest.mock('@/hooks/use-clients', () => ({
  useClient: jest.fn(),
}))

jest.mock('@/lib/api-config', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
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

const { useClient } = require('@/hooks/use-clients')
const { apiClient } = require('@/lib/api-config')

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

const createMockClient = (overrides: Partial<Client> = {}): Client => ({
  id: 1,
  name: 'テストクライアント',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('CompanySelectionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // apiClient.getはResponseオブジェクトを返す必要がある
    apiClient.get.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        results: [],
        count: 0,
      }),
    } as any)
    apiClient.post.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        added_count: 0,
        errors: [],
      }),
    } as any)
  })

  describe('全列の表示確認', () => {
    it('テーブルヘッダーに全列が表示される', async () => {
      const client = createMockClient()
      const companies = [createMockCompany()]
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: companies,
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

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
      const client = createMockClient()
      const company = createMockCompany()
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
      }, { timeout: 3000 })

      await waitFor(() => {
        const contactCell = screen.getByTestId('company-1-contact')
        expect(contactCell).toBeInTheDocument()
        expect(contactCell).toHaveTextContent('田中太郎')
        expect(contactCell).toHaveTextContent('営業部長')
        
        const facebookCell = screen.getByTestId('company-1-facebook')
        expect(facebookCell).toBeInTheDocument()
        const facebookLink = screen.getByTestId('company-1-facebook-link')
        expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/test')
        
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
      const client = createMockClient()
      const company = createMockCompany({
        contact_person_name: '山田花子',
        contact_person_position: 'マーケティング部長',
      })
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        const contactCell = screen.getByTestId('company-1-contact')
        expect(contactCell).toBeInTheDocument()
        expect(contactCell).toHaveTextContent('山田花子')
        expect(contactCell).toHaveTextContent('マーケティング部長')
      }, { timeout: 3000 })
    })

    it('担当者が未設定の場合は「未設定」と表示される', async () => {
      const client = createMockClient()
      const company = createMockCompany({
        contact_person_name: undefined,
        contact_person_position: undefined,
      })
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        const contactCell = screen.getByTestId('company-1-contact')
        expect(contactCell).toHaveTextContent('未設定')
      }, { timeout: 3000 })
    })
  })

  describe('Facebook列の表示', () => {
    it('Facebook URLが設定されている場合はリンクとして表示される', async () => {
      const client = createMockClient()
      const company = createMockCompany({
        facebook_url: 'https://facebook.com/test-company',
      })
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        const facebookLink = screen.getByTestId('company-1-facebook-link')
        expect(facebookLink).toBeInTheDocument()
        expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/test-company')
        expect(facebookLink).toHaveAttribute('target', '_blank')
        expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer')
      }, { timeout: 3000 })
    })

    it('Facebook URLが未設定の場合は「未設定」と表示される', async () => {
      const client = createMockClient()
      const company = createMockCompany({
        facebook_url: undefined,
      })
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        const facebookCell = screen.getByTestId('company-1-facebook')
        expect(facebookCell).toHaveTextContent('未設定')
      }, { timeout: 3000 })
    })
  })

  describe('売上列の表示', () => {
    it('売上が通貨形式でフォーマットされて表示される', async () => {
      const client = createMockClient()
      const company = createMockCompany({
        revenue: 5000000,
      })
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        const revenueCell = screen.getByTestId('company-1-revenue')
        expect(revenueCell.textContent).toContain('5,000,000')
      }, { timeout: 3000 })
    })

    it('売上が未設定の場合は「-」と表示される', async () => {
      const client = createMockClient()
      const company = createMockCompany({
        revenue: null,
      })
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [company],
              count: 1,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      await waitFor(() => {
        const dashes = screen.getAllByText('-')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('ステータス列の表示', () => {
    it('各ステータスが正しく表示される', async () => {
      const client = createMockClient()
      const companies = [
        createMockCompany({ id: 1, status: 'active' }),
        createMockCompany({ id: 2, status: 'prospect' }),
        createMockCompany({ id: 3, status: 'inactive' }),
      ]
      
      useClient.mockReturnValue({
        client,
        loading: false,
      })

      // 企業データ取得のモック
      apiClient.get.mockImplementation((url: string) => {
        if (url.includes('/available-companies')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: companies,
              count: 3,
            }),
          } as any)
        }
        if (url.includes('/projects')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({
              results: [],
            }),
          } as any)
        }
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ results: [] }),
        } as any)
      })

      render(<CompanySelectionPage />)

      // データがロードされるまで待機
      await waitFor(() => {
        const statusCell1 = screen.getByTestId('company-1-status')
        expect(statusCell1).toBeInTheDocument()
      }, { timeout: 3000 })

      await waitFor(() => {
        const statusCell1 = screen.getByTestId('company-1-status')
        expect(statusCell1).toHaveTextContent('アクティブ')
        
        const statusCell2 = screen.getByTestId('company-2-status')
        expect(statusCell2).toHaveTextContent('見込み客')
        
        const statusCell3 = screen.getByTestId('company-3-status')
        expect(statusCell3).toHaveTextContent('非アクティブ')
      }, { timeout: 3000 })
    })
  })
})

