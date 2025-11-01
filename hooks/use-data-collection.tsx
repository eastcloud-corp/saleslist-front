
"use client"

import { useCallback, useEffect, useState } from "react"

import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type {
  AiUsageMetrics,
  DataCollectionRun,
  DataCollectionRunListResponse,
  DataCollectionTriggerResponse,
} from "@/lib/types"

const PAGE_SIZE = 100

export interface DataCollectionFilters {
  job_name?: string
  status?: string
  started_after?: string
  started_before?: string
}

export interface UseDataCollectionOptions {
  page?: number
  filters?: DataCollectionFilters
}

interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function useDataCollectionRuns({ page = 1, filters = {} }: UseDataCollectionOptions) {
  const [runs, setRuns] = useState<DataCollectionRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextScheduledFor, setNextScheduledFor] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Record<string, string | null>>({})
  const [aiUsage, setAiUsage] = useState<AiUsageMetrics | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: PAGE_SIZE.toString(),
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return
        params.append(key, String(value))
      })

      const endpoint = `${API_CONFIG.ENDPOINTS.DATA_COLLECTION_RUNS}?${params.toString()}`
      const data = await apiClient.get<DataCollectionRunListResponse>(endpoint)

      setRuns(data.results || [])
      setNextScheduledFor(data.next_scheduled_for ?? null)
      setSchedules(data.schedules || {})
      setAiUsage(data.ai_usage ?? null)
      const total = typeof data.count === "number" ? data.count : data.results?.length ?? 0
      setPagination({
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      })
    } catch (err) {
      console.error("[useDataCollectionRuns] fetch error", err)
      const message = err instanceof Error ? err.message : "実行履歴の取得に失敗しました"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  const triggerJob = useCallback(async (jobName: string, options: Record<string, unknown>) => {
    try {
      const payload = {
        job_name: jobName,
        options,
      }
      const result = await apiClient.post<DataCollectionTriggerResponse>(API_CONFIG.ENDPOINTS.DATA_COLLECTION_TRIGGER, payload)
      setAiUsage(result.ai_usage ?? null)
      return result
    } catch (err) {
      console.error("[useDataCollectionRuns] trigger error", err)
      const message = err instanceof Error ? err.message : "ジョブの起動に失敗しました"
      throw new Error(message)
    }
  }, [])

  return {
    runs,
    loading,
    error,
    pagination,
    schedules,
    nextScheduledFor,
    refetch: fetchRuns,
    triggerJob,
    aiUsage,
  }
}
