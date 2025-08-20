"use client"

import { useState, useEffect } from "react"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import type { Company, CompanyFilters } from "@/lib/types"
import { authService } from "@/lib/auth"

export function useCompanies(filters: CompanyFilters = {}, page = 1, limit = 100) {
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
          limit: limit.toString(),
        })

        // Add filters to params
        if (filters.search) params.append("search", filters.search)
        if (filters.industry?.length) {
          filters.industry.forEach((industry) => params.append("industry", industry))
        }
        if (filters.employee_count_min) params.append("employee_count_min", filters.employee_count_min.toString())
        if (filters.employee_count_max) params.append("employee_count_max", filters.employee_count_max.toString())
        if (filters.revenue_min) params.append("revenue_min", filters.revenue_min.toString())
        if (filters.revenue_max) params.append("revenue_max", filters.revenue_max.toString())
        if (filters.location?.length) {
          filters.location.forEach((location) => params.append("location", location))
        }
        if (filters.status?.length) {
          filters.status.forEach((status) => params.append("status", status))
        }

        const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.COMPANIES}?${params.toString()}`, {
          headers: authService.getAuthHeaders(),
        })

        console.log("[v0] Companies API response status for page", currentPage, ":", response.status)

        if (!response.ok) {
          throw new Error("Failed to fetch companies")
        }

        const data = await response.json()
        console.log("[v0] Page", currentPage, "API response data:", data)
        console.log("[v0] Page", currentPage, "Results array length:", data.results?.length)

        if (data && data.results && Array.isArray(data.results)) {
          // APIレスポンスの形式をCompany型に変換
          const transformedCompanies: Company[] = data.results.map((item: any) => ({
            id: item.id.toString(),
            name: item.name || "",
            industry: item.industry || "",
            employee_count: item.employee_count || 0,
            revenue: item.revenue || 0,
            location: `${item.prefecture || ""}${item.city ? `, ${item.city}` : ""}`.trim(),
            website: item.website_url || "",
            phone: item.phone || "",
            email: item.contact_email || "",
            description: item.notes || "",
            status: "active", // デフォルトステータス
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            executives: item.executives || [],
          }))

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
  }, [filters, page, limit])

  return {
    companies,
    pagination,
    isLoading,
    error,
    refetch: fetchCompanies,
  }
}
