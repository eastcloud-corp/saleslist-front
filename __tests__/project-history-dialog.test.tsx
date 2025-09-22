import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { ProjectHistoryDialog } from '@/app/projects/components/project-history-dialog'

const mockGet = jest.fn()
const mockPost = jest.fn()

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock('@/lib/api-config', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
  API_CONFIG: {
    ENDPOINTS: {
      PROJECT_SNAPSHOTS: (id: string) => `/projects/${id}/snapshots/`,
      PROJECT_SNAPSHOT_RESTORE: (projectId: string, snapshotId: string) =>
        `/projects/${projectId}/snapshots/${snapshotId}/restore/`,
    },
  },
}))

describe('ProjectHistoryDialog', () => {
  const project = { id: 1, name: '案件A' } as any

  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
  })

  const createSnapshot = (overrides: Partial<any> = {}) => ({
    id: 101,
    project: 1,
    created_at: new Date().toISOString(),
    created_by: 1,
    created_by_name: '担当 太郎',
    reason: 'bulk_edit: status,service_type',
    source: 'bulk_edit',
    source_label: '一括編集',
    changed_fields: ['status', 'service_type'],
    project_overview: {
      name: '案件A',
      progress_status: '進行中',
      service_type: 'コンサル',
    },
    ...overrides,
  })

  it('renders snapshots, allows detail view and restore', async () => {
    const recentSnapshot = createSnapshot({
      project_overview: {
        name: '案件A',
        progress_status: '進行中',
        service_type: '',
        appointment_count: 10,
        operation_start_date: 'invalid-date',
      },
    })

    mockGet
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [recentSnapshot] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [recentSnapshot] }),
      })
    mockPost.mockResolvedValue({ ok: true, json: async () => ({}) })

    const onRestored = jest.fn()
    render(
      <ProjectHistoryDialog
        open
        project={project}
        onOpenChange={() => {}}
        onRestored={onRestored}
      />,
    )

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/projects/1/snapshots/?page_size=25')
      expect(screen.getByText('一括編集')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('詳細を見る'))
    })

    expect(screen.getByText('案件名:')).toBeInTheDocument()
    expect(screen.getByText('更新')).toBeInTheDocument()
    const numberCells = screen.getAllByText('10')
    expect(numberCells.length).toBeGreaterThan(0)
    expect(screen.getAllByText('invalid-date')).not.toHaveLength(0)

    await act(async () => {
      fireEvent.click(screen.getByText('この状態に戻す'))
    })

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/projects/1/snapshots/101/restore/', {})
      expect(onRestored).toHaveBeenCalled()
    })
  })

  it('shows error message when snapshot fetch fails', async () => {
    mockGet.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Internal Error',
    })

    render(
      <ProjectHistoryDialog
        open
        project={project}
        onOpenChange={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/履歴の取得に失敗しました/)).toBeInTheDocument()
    })
  })

  it('handles restore errors gracefully', async () => {
    const snapshot = createSnapshot()
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [snapshot] }),
    })
    mockPost.mockResolvedValue({
      ok: false,
      text: async () => 'restore failed',
    })

    render(
      <ProjectHistoryDialog
        open
        project={project}
        onOpenChange={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('詳細を見る')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('詳細を見る'))
      fireEvent.click(screen.getByText('この状態に戻す'))
    })

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled()
    })
  })

  it('displays fallback notice when only older snapshots exist', async () => {
    const olderSnapshot = createSnapshot({
      id: 202,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      changed_fields: undefined,
      reason: 'restore: progress_status',
      project_overview: { name: '案件A', progress_status: '完了' },
    })

    mockGet.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [olderSnapshot] }),
    })

    render(
      <ProjectHistoryDialog
        open
        project={project}
        onOpenChange={() => {}}
      />,
    )

    await waitFor(() => {
      expect(
        screen.getByText('過去7日以内の履歴が無かったため、取得できる最新の履歴を表示しています。'),
      ).toBeInTheDocument()
    })
  })

  it('resets state when the dialog is closed', async () => {
    const snapshot = createSnapshot()
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [snapshot] }),
    })

    const { rerender } = render(
      <ProjectHistoryDialog
        open
        project={project}
        onOpenChange={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('詳細を見る')).toBeInTheDocument()
    })

    rerender(
      <ProjectHistoryDialog
        open={false}
        project={project}
        onOpenChange={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.queryByText('詳細を見る')).not.toBeInTheDocument()
    })
  })
})
