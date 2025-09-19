"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"
import { API_CONFIG } from "@/lib/api-config"
import type { Company, CompanyFilter, PaginatedResponse, BulkAddCompaniesResponse } from "@/lib/types"

export function useCompanies(filters: CompanyFilter = {}, page = 1, limit = 100) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
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
      let allCompanies: Company[] = []
      let currentPage = page
      let hasMore = true
      const targetCount = 100 // 目標取得件数

      while (hasMore && allCompanies.length < targetCount) {
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: limit.toString(),
        })

        // Add filters to params
        if (filters.search) params.append("search", filters.search)
        if (filters.industry) params.append("industry", filters.industry)
        if (filters.employee_min) params.append("employee_min", filters.employee_min.toString())
        if (filters.employee_max) params.append("employee_max", filters.employee_max.toString())
        if (filters.revenue_min) params.append("revenue_min", filters.revenue_min.toString())
        if (filters.revenue_max) params.append("revenue_max", filters.revenue_max.toString())
        if (filters.prefecture) params.append("prefecture", filters.prefecture)
        if (filters.established_year_min) params.append("established_year_min", filters.established_year_min.toString())
        if (filters.established_year_max) params.append("established_year_max", filters.established_year_max.toString())
        if (filters.has_facebook !== undefined) params.append("has_facebook", filters.has_facebook.toString())
        if (filters.exclude_ng !== undefined) params.append("exclude_ng", filters.exclude_ng.toString())
        if (filters.project_id) params.append("project_id", filters.project_id.toString())

        const data = await apiClient.get<PaginatedResponse<Company>>(
          `${API_CONFIG.ENDPOINTS.COMPANIES}?${params.toString()}`
        )
        console.log("[v0] Page", currentPage, "API response data:", data)
        console.log("[v0] Page", currentPage, "Results array length:", data.results?.length)

        if (data && data.results && Array.isArray(data.results)) {
          // データは既にCompany型として返される
          const transformedCompanies: Company[] = data.results

          // 重複を避けるため、IDでフィルタリング
          const existingIds = new Set(allCompanies.map((c) => c.id))
          const newCompanies = transformedCompanies.filter((c) => !existingIds.has(c.id))
          allCompanies = [...allCompanies, ...newCompanies]

          console.log("[v0] Page", currentPage, "added", newCompanies.length, "new companies")
          console.log("[v0] Total companies collected so far:", allCompanies.length)

          // 次のページがあるかチェック
          hasMore = !!data.next && data.results.length > 0
          currentPage++

          // 最初のページのpagination情報を保存
          if (currentPage === page + 1) {
            const totalPages = Math.ceil(data.count / limit)
            setPagination({
              page: page,
              limit: limit,
              total: data.count,
              total_pages: totalPages,
            })
          }
        } else {
          console.log("[v0] Invalid response format for page", currentPage, ":", data)
          hasMore = false
        }

        // 無限ループを防ぐため、最大10ページまでに制限
        if (currentPage > page + 10) {
          console.log("[v0] Reached maximum page limit")
          break
        }
      }

      setCompanies(allCompanies)
      console.log("[v0] Successfully processed", allCompanies.length, "companies total")
    } catch (err) {
      console.log("[v0] Companies API error:", err)
      setError(err instanceof Error ? err.message : "企業データの取得に失敗しました")
      setCompanies([])
      setPagination({
        page: 1,
        limit: 100,
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
