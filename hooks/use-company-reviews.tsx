"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { API_CONFIG } from "@/lib/api-config"
import { apiClient } from "@/lib/api-client"
import { createLogger } from "@/lib/logger"
import type {
  CompanyReviewBatch,
  CompanyReviewBatchDetail,
  CompanyReviewDecisionPayload,
  CompanyReviewDecisionAction,
} from "@/lib/types"

const reviewLogger = createLogger("companies:reviews")

type CorporateNumberImportStats = {
  checked: number
  matched: number
  not_found: number
  errors: number
  skipped_prefecture: number
  skipped_name: number
}

type CorporateNumberImportRequest = {
  company_ids?: number[]
  limit?: number
  prefecture_strict?: boolean
  dry_run?: boolean
  force?: boolean
}

type CorporateNumberImportResponse = {
  stats: CorporateNumberImportStats
  entries_count: number
  created_count: number
  batch_ids: number[]
  dry_run: boolean
  summary?: string
}

type OpenDataIngestionRequest = {
  sources?: string[]
  limit?: number
  dry_run?: boolean
}

type OpenDataIngestionResponse = {
  processed_sources: number
  rows: number
  matched: number
  created: number
  dry_run: boolean
  skipped_no_config?: boolean
  skipped_no_source?: boolean
}

export interface ReviewFilters {
  status?: string
  sourceType?: string
  confidenceMin?: number
  field?: string
}

export function useCompanyReviewBatches(initialFilters: ReviewFilters = {}) {
  const [batches, setBatches] = useState<CompanyReviewBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReviewFilters>(initialFilters)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [isGeneratingSample, setIsGeneratingSample] = useState(false)
  const [isRunningCorporateImport, setIsRunningCorporateImport] = useState(false)
  const [isRunningOpenDataIngestion, setIsRunningOpenDataIngestion] = useState(false)

  const fetchBatches = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status)
      }
      if (filters.sourceType && filters.sourceType !== "all") {
        params.append("source_type", filters.sourceType)
      }
      if (typeof filters.confidenceMin === "number" && Number.isFinite(filters.confidenceMin)) {
        params.append("confidence_min", String(filters.confidenceMin))
      }
      if (filters.field && filters.field !== "all") {
        params.append("field", filters.field)
      }

      const endpoint =
        params.toString().length > 0
          ? `${API_CONFIG.ENDPOINTS.COMPANY_REVIEW_BATCHES}?${params.toString()}`
          : API_CONFIG.ENDPOINTS.COMPANY_REVIEW_BATCHES

      reviewLogger.debug("fetchBatches: request", { endpoint })
      type ReviewListResponse = { results?: CompanyReviewBatch[]; count?: number } | CompanyReviewBatch[]
      const data = await apiClient.get<ReviewListResponse>(endpoint)

      let results: CompanyReviewBatch[] = []
      if (Array.isArray(data)) {
        results = data
      } else if (Array.isArray(data?.results)) {
        results = data.results
      }

      setBatches(results)
      if (results.length > 0) {
        const latest = results.reduce((acc, batch) => {
          if (!acc) return batch.updated_at
          return acc > batch.updated_at ? acc : batch.updated_at
        }, results[0]?.updated_at ?? null)
        setLastUpdatedAt(latest)
      } else {
        setLastUpdatedAt(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "レビュー候補の取得に失敗しました"
      reviewLogger.error("fetchBatches: error", { message })
      setError(message)
      setBatches([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  return {
    batches,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchBatches,
    lastUpdatedAt,
    generateSample: async (options?: { companyId?: number; fields?: string[] }) => {
      setIsGeneratingSample(true)
      setError(null)
      try {
        const payload: Record<string, unknown> = {}
        if (options?.companyId) {
          payload.company_id = options.companyId
        }
        if (options?.fields && options.fields.length > 0) {
          payload.fields = options.fields
        }
        const endpoint = `${API_CONFIG.ENDPOINTS.COMPANY_REVIEW_BATCHES}generate-sample/`
        reviewLogger.info("generateSample: request", payload)
        const created = await apiClient.post<{ created_count: number }>(endpoint, payload)
        reviewLogger.info("generateSample: success", created)
        await fetchBatches()
        return created
      } catch (err) {
        const message = err instanceof Error ? err.message : "サンプル候補の生成に失敗しました"
        reviewLogger.error("generateSample: error", { message })
        setError(message)
        throw err
      } finally {
        setIsGeneratingSample(false)
      }
    },
    isGeneratingSample,
    runCorporateNumberImport: async (payload: CorporateNumberImportRequest = {}) => {
      setIsRunningCorporateImport(true)
      setError(null)
      try {
        const endpoint = API_CONFIG.ENDPOINTS.COMPANY_REVIEW_RUN_CORPORATE_IMPORT
        reviewLogger.info("runCorporateNumberImport: request", payload)
        const result = await apiClient.post<CorporateNumberImportResponse>(endpoint, payload)
        reviewLogger.info("runCorporateNumberImport: success", {
          created_count: result.created_count,
          entries_count: result.entries_count,
        })
        await fetchBatches()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : "法人番号自動取得バッチの実行に失敗しました"
        reviewLogger.error("runCorporateNumberImport: error", { message })
        setError(message)
        throw err
      } finally {
        setIsRunningCorporateImport(false)
      }
    },
    isRunningCorporateImport,
    runOpenDataIngestion: async (payload: OpenDataIngestionRequest = {}) => {
      setIsRunningOpenDataIngestion(true)
      setError(null)
      try {
        const result = await apiClient.post<OpenDataIngestionResponse>(
          API_CONFIG.ENDPOINTS.COMPANY_REVIEW_RUN_OPENDATA_INGESTION,
          payload,
        )
        reviewLogger.info("runOpenDataIngestion: success", result)
        await fetchBatches()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : "オープンデータ取り込みに失敗しました"
        reviewLogger.error("runOpenDataIngestion: error", { message })
        setError(message)
        throw err
      } finally {
        setIsRunningOpenDataIngestion(false)
      }
    },
    isRunningOpenDataIngestion,
  }
}

export function useCompanyReviewBatch(batchId: number | null) {
  const [batch, setBatch] = useState<CompanyReviewBatchDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchBatch = useCallback(
    async (id: number) => {
      setIsLoading(true)
      setError(null)
      try {
        const endpoint = API_CONFIG.ENDPOINTS.COMPANY_REVIEW_BATCH_DETAIL(id)
        reviewLogger.debug("fetchBatch: request", { endpoint })
        const data = await apiClient.get<CompanyReviewBatchDetail>(endpoint)
        setBatch(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "レビュー詳細の取得に失敗しました"
        reviewLogger.error("fetchBatch: error", { message, batchId: id })
        setError(message)
        setBatch(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (typeof batchId === "number") {
      fetchBatch(batchId)
    } else {
      setBatch(null)
    }
  }, [batchId, fetchBatch])

  const decide = useCallback(
    async (payload: CompanyReviewDecisionPayload) => {
      if (typeof batchId !== "number") {
        throw new Error("batchId is required to decide review")
      }
      setIsSubmitting(true)
      setError(null)
      try {
        const endpoint = API_CONFIG.ENDPOINTS.COMPANY_REVIEW_DECIDE(batchId)
        reviewLogger.info("decide: request", {
          batchId,
          items: payload.items.map((item) => ({ id: item.id, decision: item.decision })),
        })
        const data = await apiClient.post<CompanyReviewBatchDetail>(endpoint, payload)
        setBatch(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "レビュー結果の反映に失敗しました"
        reviewLogger.error("decide: error", { message, batchId })
        setError(message)
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [batchId]
  )

  const reset = useCallback(() => {
    setBatch(null)
    setError(null)
    setIsLoading(false)
    setIsSubmitting(false)
  }, [])

  return {
    batch,
    isLoading,
    error,
    isSubmitting,
    refetch: batchId ? () => fetchBatch(batchId) : undefined,
    decide,
    reset,
  }
}
