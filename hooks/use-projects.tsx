"use client"

import { useState, useEffect } from "react"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import type { Project } from "@/lib/types"
import { authService } from "@/lib/auth"

export function useProjects(page = 1, limit = 20) {
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      console.log("[v0] GET request to:", `${API_CONFIG.ENDPOINTS.PROJECTS}?${params.toString()}`)
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.PROJECTS}?${params.toString()}`, {
        headers: authService.getAuthHeaders(),
      })

      console.log("[v0] Projects API response status:", response.status)

      if (!response.ok) {
        throw new Error("プロジェクトの取得に失敗しました")
      }

      const data = await response.json()
      console.log("[v0] Projects API response data:", data)

      if (data && typeof data === "object") {
        // Check if it's the expected API format with results array
        if (Array.isArray(data.results)) {
          setProjects(data.results)

          // Calculate pagination from API response
          const totalPages = Math.ceil((data.count || 0) / limit)
          setPagination({
            page: page,
            limit: limit,
            total: data.count || 0,
            total_pages: totalPages,
          })
        } else if (Array.isArray(data.data)) {
          // Fallback for different response format
          setProjects(data.data)
          setPagination(
            data.pagination || {
              page: 1,
              limit: 20,
              total: data.data.length,
              total_pages: 1,
            },
          )
        } else {
          throw new Error("無効なレスポンス形式です")
        }
      } else {
        throw new Error("無効なレスポンス形式です")
      }
    } catch (err) {
      console.error("[v0] Projects API error:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")

      setProjects([])
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async (projectData: Omit<Project, "id" | "created_at" | "updated_at" | "companies">) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PROJECTS, projectData, {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      await fetchProjects() // Refresh the list
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [page, limit])

  return {
    projects,
    pagination,
    isLoading,
    error,
    createProject,
    refetch: fetchProjects,
  }
}
