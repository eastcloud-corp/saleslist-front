"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { API_CONFIG } from "@/lib/api-config"
import type { Company, CompanyFilter, PaginatedResponse, BulkAddCompaniesResponse } from "@/lib/types"

export function useCompanies(filters: CompanyFilter = {}, page = 1, limit = 50) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    if (!authService.isAuthenticated()) { 
      setIsLoading(false)
      // 未認証の場合はログインページにリダイレクト
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
      })

      if (limit) {
        params.append("page_size", limit.toString())
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'page' || key === 'page_size' || key === 'limit' || key === 'random_seed') {
          return
        }

        if (value === undefined || value === null) {
          return
        }

        if (Array.isArray(value)) {
          value
            .filter((item) => item !== undefined && item !== null && String(item).trim().length > 0)
            .forEach((item) => params.append(key, String(item)))
          return
        }

        if (typeof value === "string") {
          if (value.trim().length === 0) {
            return
          }
          params.append(key, value)
          return
        }

        if (typeof value === "number" && Number.isFinite(value)) {
          params.append(key, value.toString())
          return
        }

        if (typeof value === "boolean") {
          params.append(key, value.toString())
        }
      })

      const data = await apiClient.get<PaginatedResponse<Company>>(
        `${API_CONFIG.ENDPOINTS.COMPANIES}?${params.toString()}`
      )

      const results = Array.isArray(data?.results) ? data.results : []

      setCompanies(results)

      const totalCount = typeof data?.count === "number" ? data.count : results.length
      const currentLimit = limit || results.length || pagination.limit
      const totalPages = currentLimit > 0 ? Math.max(1, Math.ceil(totalCount / currentLimit)) : 1

      setPagination({
        page,
        limit: currentLimit,
        total: totalCount,
        total_pages: totalPages,
      })
    } catch (err) {
      console.log("[v0] Companies API error:", err)
      setError(err instanceof Error ? err.message : "企業データの取得に失敗しました")
      setCompanies([])
      setPagination({
        page: 1,
        limit: limit || pagination.limit,
        total: 0,
        total_pages: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [JSON.stringify(filters), page, limit])

  return {
    companies,
    pagination,
    isLoading,
    error,
    refetch: fetchCompanies,
    bulkAddCompaniesToProjects: (companyIds: number[], projectIds: number[]) =>
      apiClient.post<BulkAddCompaniesResponse>(
        API_CONFIG.ENDPOINTS.COMPANY_BULK_ADD_TO_PROJECTS,
        { company_ids: companyIds, project_ids: projectIds }
      ),
  }
}
