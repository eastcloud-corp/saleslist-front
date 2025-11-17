import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { ProjectCompanies } from '@/components/projects/project-companies'
import type { ProjectCompany } from '@/lib/types'

const toastMock = jest.fn()
const useMasterDataMock = jest.fn()

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))

jest.mock('@/hooks/use-master-data', () => ({
  useMasterData: () => useMasterDataMock(),
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

jest.mock('@/components/common/confirm-dialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onOpenChange, title, description, confirmText, cancelText }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <div>{description}</div>
        <button onClick={onConfirm} data-testid="confirm-button">
          {confirmText || 'Confirm'}
        </button>
        <button onClick={() => onOpenChange(false)} data-testid="cancel-button">
          {cancelText || 'Cancel'}
        </button>
      </div>
    ) : null,
}))

describe('ProjectCompanies', () => {
  const mockOnUpdateStatus = jest.fn()
  const mockOnRemoveCompany = jest.fn()
  const mockOnToggleActive = jest.fn()
  const mockOnAddCompany = jest.fn()

  const mockCompany: ProjectCompany = {
    id: 1,
    company_id: 100,
    company_name: 'テスト企業株式会社',
    company_industry: 'IT',
    status: '未接触',
    is_active: true,
    contact_date: '2024-01-01',
    notes: '',
    project_id: 1,
    added_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    company: {
      id: 100,
      name: 'テスト企業株式会社',
      industry: 'IT',
      website: 'https://example.com',
    },
  }

  const mockCompany2: ProjectCompany = {
    id: 2,
    company_id: 200,
    company_name: '削除対象企業株式会社',
    company_industry: '製造業',
    status: 'DM送信済み',
    is_active: true,
    contact_date: '2024-01-02',
    notes: '',
    project_id: 1,
    added_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    company: {
      id: 200,
      name: '削除対象企業株式会社',
      industry: '製造業',
    },
  }

  beforeEach(() => {
    toastMock.mockReset()
    mockOnUpdateStatus.mockReset()
    mockOnRemoveCompany.mockReset()
    mockOnToggleActive.mockReset()
    mockOnAddCompany.mockReset()
    useMasterDataMock.mockReturnValue({
      statuses: [],
    })
  })

  it('renders companies list', () => {
    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    expect(screen.getByText('テスト企業株式会社')).toBeInTheDocument()
    expect(screen.getByText('IT')).toBeInTheDocument()
  })

  it('renders empty state when no companies', () => {
    render(
      <ProjectCompanies
        companies={[]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    expect(screen.getByText('この案件にはまだ企業が追加されていません')).toBeInTheDocument()
  })

  it('displays delete button for each company', () => {
    render(
      <ProjectCompanies
        companies={[mockCompany, mockCompany2]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    // 削除ボタンを探す（Trash2アイコンを含むボタン）
    const buttons = screen.getAllByRole('button')
    const deleteButtons = buttons.filter((button) => {
      const svg = button.querySelector('svg.lucide-trash2, svg[class*="trash"]')
      return svg !== null
    })
    // 削除ボタンは各企業行に1つずつ存在する
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('opens confirmation dialog when delete button is clicked', async () => {
    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    // 削除ボタンを探す（Trash2アイコンを含むボタン）
    // まず全てのボタンを取得
    const buttons = screen.getAllByRole('button')
    // 削除ボタンは「営業詳細」ボタンの後に来る
    // または、destructiveクラスを持つボタンを探す
    const deleteButton = buttons.find((button) => {
      const svg = button.querySelector('svg.lucide-trash2, svg[class*="trash"]')
      return svg !== null
    })

    expect(deleteButton).toBeTruthy()
    if (deleteButton) {
      fireEvent.click(deleteButton)

      await waitFor(
        () => {
          expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )

      expect(screen.getByText('企業を削除')).toBeInTheDocument()
      expect(screen.getByText(/この企業を案件から削除してもよろしいですか/)).toBeInTheDocument()
    }
  })

  it('calls onRemoveCompany when delete is confirmed', async () => {
    mockOnRemoveCompany.mockResolvedValue(undefined)

    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    // 削除ボタンをクリック
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((button) => {
      const svg = button.querySelector('svg.lucide-trash2, svg[class*="trash"]')
      return svg !== null
    })

    expect(deleteButton).toBeTruthy()
    if (deleteButton) {
      fireEvent.click(deleteButton)

      await waitFor(
        () => {
          expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )

      // 確認ダイアログの「削除」ボタンをクリック
      const confirmButton = screen.getByTestId('confirm-button')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockOnRemoveCompany).toHaveBeenCalledWith('100')
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '削除成功',
            description: '企業を案件から削除しました',
          }),
        )
      })
    }
  })

  it('shows error toast when delete fails', async () => {
    const error = new Error('削除に失敗しました')
    mockOnRemoveCompany.mockRejectedValue(error)

    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    // 削除ボタンをクリック
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((button) => {
      const svg = button.querySelector('svg.lucide-trash2, svg[class*="trash"]')
      return svg !== null
    })

    expect(deleteButton).toBeTruthy()
    if (deleteButton) {
      fireEvent.click(deleteButton)

      await waitFor(
        () => {
          expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )

      // 確認ダイアログの「削除」ボタンをクリック
      const confirmButton = screen.getByTestId('confirm-button')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockOnRemoveCompany).toHaveBeenCalled()
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'エラー',
            description: '削除に失敗しました',
            variant: 'destructive',
          }),
        )
      })
    }
  })

  it('closes dialog when cancel is clicked', async () => {
    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    // 削除ボタンをクリック
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((button) => {
      const svg = button.querySelector('svg.lucide-trash2, svg[class*="trash"]')
      return svg !== null
    })

    expect(deleteButton).toBeTruthy()
    if (deleteButton) {
      fireEvent.click(deleteButton)

      await waitFor(
        () => {
          expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )

      // キャンセルボタンをクリック
      const cancelButton = screen.getByTestId('cancel-button')
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
        expect(mockOnRemoveCompany).not.toHaveBeenCalled()
      })
    }
  })

  it('disables delete button when isLoading is true', () => {
    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
        isLoading={true}
      />,
    )

    // 削除ボタンを探す
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((button) => {
      const svg = button.querySelector('svg.lucide-trash2, svg[class*="trash"]')
      return svg !== null
    })

    expect(deleteButton).toBeTruthy()
    if (deleteButton) {
      // isLoadingがtrueの時、削除ボタンはdisabled属性を持つ
      expect(deleteButton).toBeDisabled()
    }
  })

  it('displays sales detail link for each company', () => {
    render(
      <ProjectCompanies
        companies={[mockCompany]}
        onUpdateStatus={mockOnUpdateStatus}
        onRemoveCompany={mockOnRemoveCompany}
        onToggleActive={mockOnToggleActive}
        onAddCompany={mockOnAddCompany}
        projectId={1}
      />,
    )

    const salesDetailLink = screen.getByText('営業詳細')
    expect(salesDetailLink).toBeInTheDocument()
    expect(salesDetailLink.closest('a')).toHaveAttribute('href', '/projects/1/companies/100')
  })
})

