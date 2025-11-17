import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { NGListTab } from '@/components/clients/ng-list-tab'

const toastMock = jest.fn()
const useNGListMock = jest.fn()

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))

jest.mock('@/hooks/use-ng-list', () => ({
  useNGList: (...args: unknown[]) => useNGListMock(...args),
}))

jest.mock('@/components/clients/company-search-dialog', () => ({
  CompanySearchDialog: ({ open, onAddToNGList, onAddCompaniesToNG }: any) =>
    open ? (
      <div data-testid="company-search-dialog">
        <button onClick={() => onAddToNGList({ id: 42, name: 'Mock Company' })}>単一追加</button>
        <button onClick={() => onAddCompaniesToNG && onAddCompaniesToNG([1, 2, 3], '複数追加テスト')}>複数追加</button>
      </div>
    ) : null,
}))

describe('NGListTab', () => {
  const importCSV = jest.fn()
  const deleteNG = jest.fn()
  const addCompanyToNG = jest.fn()
  const addCompaniesToNG = jest.fn()

  const baseValue = {
    ngList: [],
    stats: { count: 0, matched_count: 0, unmatched_count: 0 },
    isLoading: false,
    error: null,
    importCSV,
    deleteNG,
    addCompanyToNG,
    addCompaniesToNG,
  }

  beforeEach(() => {
    toastMock.mockReset()
    importCSV.mockReset()
    deleteNG.mockReset()
    addCompanyToNG.mockReset()
    addCompaniesToNG.mockReset()
    useNGListMock.mockReturnValue(baseValue)
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn(() => true),
    })
  })

  it('renders loading state', () => {
    useNGListMock.mockReturnValue({ ...baseValue, isLoading: true })
    const { container } = render(<NGListTab clientId={1} />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders error state', () => {
    useNGListMock.mockReturnValue({ ...baseValue, error: '取得に失敗' })
    render(<NGListTab clientId={1} />)
    expect(screen.getByText('取得に失敗')).toBeInTheDocument()
  })

  it('downloads template when button is clicked', () => {
    useNGListMock.mockReturnValue({ ...baseValue })
    const appendSpy = jest.spyOn(document.body, 'appendChild')
    const removeSpy = jest.spyOn(document.body, 'removeChild')

    const originalCreate = (URL as unknown as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL
    const originalRevoke = (URL as unknown as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL
    const createMock = jest.fn(() => 'blob:ng')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createMock,
    })

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    })

    render(<NGListTab clientId={1} />)

    fireEvent.click(screen.getByText('CSVテンプレート'))

    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(createMock).toHaveBeenCalled()

    appendSpy.mockRestore()
    removeSpy.mockRestore()

    if (originalCreate) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreate,
      })
    } else {
      delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
    }

    if (originalRevoke) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevoke,
      })
    } else {
      delete (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL
    }
  })

  it('validates file extension before importing CSV', async () => {
    useNGListMock.mockReturnValue({ ...baseValue })
    render(<NGListTab clientId={2} />)

    const fileInput = screen.getByLabelText('CSVインポート') as HTMLInputElement
    const invalidFile = new File([''], 'invalid.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    expect(importCSV).not.toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'エラー',
        variant: 'destructive',
      }),
    )
  })

  it('imports CSV file and shows result toasts', async () => {
    const importResult = {
      imported_count: 3,
      matched_count: 2,
      unmatched_count: 1,
      errors: ['error1'],
    }
    importCSV.mockResolvedValue(importResult)
    useNGListMock.mockReturnValue({ ...baseValue, importCSV })

    render(<NGListTab clientId={3} />)

    const fileInput = screen.getByLabelText('CSVインポート') as HTMLInputElement
    const csvFile = new File(['企業名,理由'], 'ng.csv', { type: 'text/csv' })

    await waitFor(() => {
      fireEvent.change(fileInput, { target: { files: [csvFile] } })
    })

    await waitFor(() => {
      expect(importCSV).toHaveBeenCalledWith(csvFile)
    })

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'インポート完了',
        description: '3件のNGリストを登録しました（マッチ: 2件）',
      }),
    )
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '一部エラーがありました',
        variant: 'destructive',
      }),
    )
  })

  it('shows error toast when CSV import fails', async () => {
    importCSV.mockRejectedValueOnce(new Error('import failed'))
    useNGListMock.mockReturnValue({ ...baseValue, importCSV })

    render(<NGListTab clientId={5} />)

    const fileInput = screen.getByLabelText('CSVインポート') as HTMLInputElement
    const csvFile = new File(['企業名,理由'], 'ng.csv', { type: 'text/csv' })

    fireEvent.change(fileInput, { target: { files: [csvFile] } })

    await waitFor(() => {
      expect(importCSV).toHaveBeenCalled()
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'エラー', description: 'インポートに失敗しました' }),
      )
    })
  })

  it('deletes NG entry after confirmation', async () => {
    const ngItem = {
      id: 9,
      client_id: 1,
      company_name: '削除株式会社',
      matched: false,
      reason: '重複',
      created_at: '2024-01-01T00:00:00Z',
    }
    useNGListMock.mockReturnValue({
      ...baseValue,
      ngList: [ngItem],
      stats: { count: 1, matched_count: 0, unmatched_count: 1 },
      deleteNG,
    })

    render(<NGListTab clientId={4} />)

    fireEvent.click(screen.getByLabelText('削除株式会社をNGリストから削除'))

    await waitFor(() => {
      expect(deleteNG).toHaveBeenCalledWith(9)
    })
  })

  it('shows toast when NG deletion fails', async () => {
    window.confirm = jest.fn(() => true)
    deleteNG.mockRejectedValueOnce(new Error('delete failed'))
    useNGListMock.mockReturnValue({
      ...baseValue,
      ngList: [
        {
          id: 3,
          client_id: 1,
          company_name: '失敗株式会社',
          matched: true,
          reason: '',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      stats: { count: 1, matched_count: 1, unmatched_count: 0 },
      deleteNG,
    })

    render(<NGListTab clientId={6} />)

    fireEvent.click(screen.getByLabelText('失敗株式会社をNGリストから削除'))

    await waitFor(() => {
      expect(deleteNG).toHaveBeenCalledWith(3)
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'エラー', description: '削除に失敗しました' }),
      )
    })
  })

  it('adds company to NG list via search dialog', async () => {
    useNGListMock.mockReturnValue({ ...baseValue, addCompanyToNG })

    render(<NGListTab clientId={7} />)

    fireEvent.click(screen.getByText('企業検索'))

    fireEvent.click(screen.getByText('単一追加'))

    await waitFor(() => {
      expect(addCompanyToNG).toHaveBeenCalledWith(42, 'Mock Company', undefined)
    })
  })

  it('adds multiple companies to NG list via search dialog', async () => {
    const addCompaniesToNG = jest.fn().mockResolvedValue({
      message: '3社をNGリストに追加しました',
      added_count: 3,
      skipped_count: 0,
      error_count: 0,
      added: [
        { company_id: 1, company_name: '企業1', ng_id: 10 },
        { company_id: 2, company_name: '企業2', ng_id: 11 },
        { company_id: 3, company_name: '企業3', ng_id: 12 },
      ],
      skipped: [],
      errors: [],
    })
    useNGListMock.mockReturnValue({ ...baseValue, addCompaniesToNG })

    render(<NGListTab clientId={8} />)

    fireEvent.click(screen.getByText('企業検索'))

    fireEvent.click(screen.getByText('複数追加'))

    await waitFor(() => {
      expect(addCompaniesToNG).toHaveBeenCalledWith([1, 2, 3], '複数追加テスト')
    })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '追加完了',
          description: expect.stringContaining('3社'),
        }),
      )
    })
  })

  it('handles bulk add with partial success', async () => {
    const addCompaniesToNG = jest.fn().mockResolvedValue({
      message: '2社をNGリストに追加しました（1社スキップ、0件エラー）',
      added_count: 2,
      skipped_count: 1,
      error_count: 0,
      added: [
        { company_id: 1, company_name: '企業1', ng_id: 10 },
        { company_id: 2, company_name: '企業2', ng_id: 11 },
      ],
      skipped: [{ company_id: 3, company_name: '企業3', reason: '既にNGリストに登録されています' }],
      errors: [],
    })
    useNGListMock.mockReturnValue({ ...baseValue, addCompaniesToNG })

    render(<NGListTab clientId={9} />)

    fireEvent.click(screen.getByText('企業検索'))
    fireEvent.click(screen.getByText('複数追加'))

    await waitFor(() => {
      expect(addCompaniesToNG).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '追加完了',
        }),
      )
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '一部スキップされました',
        }),
      )
    })
  })
})
