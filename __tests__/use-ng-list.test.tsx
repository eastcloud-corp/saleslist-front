import { act, renderHook, waitFor } from '@testing-library/react'
import { useNGList } from '@/hooks/use-ng-list'

const mockGet = jest.fn()
const mockUploadFile = jest.fn()
const mockDelete = jest.fn()
const mockPost = jest.fn()

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    uploadFile: (...args: unknown[]) => mockUploadFile(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}))

jest.mock('@/lib/api-config', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      NG_COMPANY_IMPORT: (clientId: string) => `/clients/${clientId}/ng-companies/import`,
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  authService: {
    isAuthenticated: () => true,
  },
}))

describe('useNGList', () => {
  const ngListResponse = {
    results: [
      {
        id: 1,
        client_id: 10,
        company_name: 'テスト株式会社',
        matched: true,
        reason: '競合',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    count: 1,
    matched_count: 1,
    unmatched_count: 0,
  }

  beforeEach(() => {
    mockGet.mockReset()
    mockUploadFile.mockReset()
    mockDelete.mockReset()
    mockPost.mockReset()
    mockGet.mockResolvedValue(ngListResponse)
  })

  it('fetches NG list and exposes helper methods', async () => {
    const { result } = renderHook(() => useNGList(10))

    await waitFor(() => {
      expect(result.current.ngList).toHaveLength(1)
    })

    expect(result.current.stats.count).toBe(1)
    expect(mockGet).toHaveBeenCalledWith('/clients/10/ng-companies')
  })

  it('imports CSV and refreshes the list', async () => {
    const file = new File(['企業名,理由'], 'ng.csv', { type: 'text/csv' })
    mockUploadFile.mockResolvedValue({
      imported_count: 2,
      matched_count: 1,
      unmatched_count: 1,
      errors: [],
    })

    const { result } = renderHook(() => useNGList(20))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    mockGet.mockClear()

    await act(async () => {
      await result.current.importCSV(file)
    })

    expect(mockUploadFile).toHaveBeenCalledWith('/clients/20/ng-companies/import', file)
    expect(mockGet).toHaveBeenCalled()
  })

  it('deletes NG entries and refreshes the list', async () => {
    mockDelete.mockResolvedValue(undefined)
    const { result } = renderHook(() => useNGList(11))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    mockGet.mockClear()

    await act(async () => {
      await result.current.deleteNG(5)
    })

    expect(mockDelete).toHaveBeenCalledWith('/clients/11/ng-companies/5')
    expect(mockGet).toHaveBeenCalled()
  })

  it('adds companies to NG list via API', async () => {
    mockPost.mockResolvedValue(undefined)
    const { result } = renderHook(() => useNGList(12))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    mockGet.mockClear()

    await act(async () => {
      await result.current.addCompanyToNG(7, 'Target', 'テスト理由')
    })

    expect(mockPost).toHaveBeenCalledWith('/clients/12/ng-companies/add/', {
      company_id: 7,
      company_name: 'Target',
      reason: 'テスト理由',
    })
    expect(mockGet).toHaveBeenCalled()
  })

  it('handles fetch errors gracefully', async () => {
    mockGet.mockRejectedValueOnce(new Error('fetch failed'))
    const { result } = renderHook(() => useNGList(30))

    await waitFor(() => {
      expect(result.current.error).toBe('NGリストの取得に失敗しました')
      expect(result.current.ngList).toHaveLength(0)
      expect(result.current.stats.count).toBe(0)
    })
  })

  it('propagates errors during CSV import', async () => {
    const file = new File(['companies'], 'ng.csv', { type: 'text/csv' })
    mockUploadFile.mockRejectedValueOnce(new Error('upload failed'))
    const { result } = renderHook(() => useNGList(40))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    await expect(result.current.importCSV(file)).rejects.toThrow('CSVインポートに失敗しました')
  })

  it('propagates errors during deletion', async () => {
    mockDelete.mockRejectedValueOnce(new Error('delete failed'))
    const { result } = renderHook(() => useNGList(50))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    await expect(result.current.deleteNG(99)).rejects.toThrow('NG企業の削除に失敗しました')
  })

  it('propagates errors when adding to NG list', async () => {
    mockPost.mockRejectedValueOnce(new Error('add failed'))
    const { result } = renderHook(() => useNGList(60))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    await expect(result.current.addCompanyToNG(1, 'Error Company', '理由')).rejects.toThrow('NG企業の追加に失敗しました')
  })

  it('adds multiple companies to NG list via bulk API', async () => {
    const bulkResponse = {
      message: '2社をNGリストに追加しました',
      added_count: 2,
      skipped_count: 0,
      error_count: 0,
      added: [
        { company_id: 1, company_name: '企業1', ng_id: 10 },
        { company_id: 2, company_name: '企業2', ng_id: 11 },
      ],
      skipped: [],
      errors: [],
    }
    mockPost.mockResolvedValue(bulkResponse)
    const { result } = renderHook(() => useNGList(70))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    mockGet.mockClear()

    await act(async () => {
      await result.current.addCompaniesToNG([1, 2], '一括追加テスト')
    })

    expect(mockPost).toHaveBeenCalledWith('/clients/70/ng-companies/bulk-add/', {
      company_ids: [1, 2],
      reason: '一括追加テスト',
    })
    expect(mockGet).toHaveBeenCalled()
  })

  it('handles bulk add with partial success', async () => {
    const bulkResponse = {
      message: '1社をNGリストに追加しました（1社スキップ、0件エラー）',
      added_count: 1,
      skipped_count: 1,
      error_count: 0,
      added: [{ company_id: 1, company_name: '企業1', ng_id: 10 }],
      skipped: [{ company_id: 2, company_name: '企業2', reason: '既にNGリストに登録されています' }],
      errors: [],
    }
    mockPost.mockResolvedValue(bulkResponse)
    const { result } = renderHook(() => useNGList(80))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    mockGet.mockClear()

    await act(async () => {
      await result.current.addCompaniesToNG([1, 2], '部分成功テスト')
    })

    expect(mockPost).toHaveBeenCalledWith('/clients/80/ng-companies/bulk-add/', {
      company_ids: [1, 2],
      reason: '部分成功テスト',
    })
    expect(mockGet).toHaveBeenCalled()
  })

  it('handles bulk add errors', async () => {
    mockPost.mockRejectedValueOnce(new Error('bulk add failed'))
    const { result } = renderHook(() => useNGList(90))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    await expect(result.current.addCompaniesToNG([1, 2], 'エラーテスト')).rejects.toThrow('NG企業の一括追加に失敗しました')
  })
})
