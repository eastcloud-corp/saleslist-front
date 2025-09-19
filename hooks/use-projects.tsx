"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"  
import type { Project, Company } from "@/lib/types"
import { authService } from "@/lib/auth"

interface ProjectFilters {
  search?: string
  client?: string | number
  status?: string
  progress_status?: string | number
  service_type?: string | number
  media_type?: string | number
  list_availability?: string | number
  list_import_source?: string | number
  regular_meeting_status?: string | number
}

interface UseProjectsOptions {
  page?: number
  limit?: number
  filters?: ProjectFilters
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { page = 1, limit = 20, filters = {} } = options
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    // 認証チェック
    if (!authService.isAuthenticated()) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        management_mode: 'true',
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (typeof value === 'string' && value.trim() === '') return
        params.append(key, String(value))
      })

      console.log("[v0] GET request to:", `${API_CONFIG.ENDPOINTS.PROJECTS}?${params.toString()}`)
      const data = await apiClient.get<{results: Project[], count: number}>(`/projects?${params.toString()}`)
      console.log("[v0] Projects API response data:", data)

      // 型安全になったので直接アクセス可能
      setProjects(data.results || [])

      // Calculate pagination from API response
      const totalPages = Math.ceil((data.count || 0) / limit)
      setPagination({
        page: page,
        limit: limit,
        total: data.count || 0,
        total_pages: totalPages,
      })
    } catch (err) {
      console.error("[v0] Projects API error:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")

      setProjects([])
      setPagination({
        page: 1,
        limit: limit,
        total: 0,
        total_pages: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, limit, page])

  const createProject = async (projectData: Omit<Project, "id" | "created_at" | "updated_at" | "companies">) => {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.PROJECTS, projectData)
      await fetchProjects() // Refresh the list
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    pagination,
    isLoading,
    error,
    createProject,
    refetch: fetchProjects,
  }
}

export function useProject(id: string | number) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])
  const [isLoadingAvailableCompanies, setIsLoadingAvailableCompanies] = useState(false)

  const fetchProject = async () => {
    if (!authService.isAuthenticated()) { setIsLoading(false); return; }
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] GET request to:", `/projects/${id}/?management_mode=true`)
      const data = await apiClient.get<Project>(`/projects/${id}/?management_mode=true`)
      console.log("[v0] Project detail API response data:", data)
      
      setProject(data)
    } catch (err) {
      console.error("[v0] Project detail API error:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setProject(null)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProject = async (projectData: Partial<Project>) => {
    try {
      await apiClient.put(`${API_CONFIG.ENDPOINTS.PROJECTS}${id}/`, projectData)
      await fetchProject() // Refresh the project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("エラーが発生しました")
    }
  }

  const updateCompanyStatus = async (
    companyId: number,
    statusData: {
      status?: string
      contact_date?: string
      next_action?: string
      notes?: string
      staff_id?: number
      is_active?: boolean
    },
  ) => {
    try {
      await apiClient.patch(
        `${API_CONFIG.ENDPOINTS.PROJECTS}${id}/companies/${companyId}/`,
        statusData
      )
      await fetchProject() // Refresh the project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("エラーが発生しました")
    }
  }

  const addCompanies = async (companyIds: number[]) => {
    try {
      await apiClient.post(
        `${API_CONFIG.ENDPOINTS.PROJECTS}${id}/add-companies/`,
        { company_ids: companyIds }
      )
      await fetchProject() // Refresh the project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("エラーが発生しました")
    }
  }
  
  const fetchAvailableCompanies = async () => {
    if (!authService.isAuthenticated()) return
    setIsLoadingAvailableCompanies(true)
    
    try {
      const data = await apiClient.get<{results: Company[]}>(`/projects/${id}/available-companies/`)
      setAvailableCompanies(data.results || [])
    } catch (error) {
      console.error('利用可能企業取得エラー:', error)
    } finally {
      setIsLoadingAvailableCompanies(false)
    }
  }

  const removeCompany = async (companyId: number) => {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.PROJECTS}${id}/companies/${companyId}/`)
      await fetchProject() // Refresh the project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("エラーが発生しました")
    }
  }

  useEffect(() => {
    if (id) {
      fetchProject()
      fetchAvailableCompanies()
    }
  }, [id])

  return {
    project,
    isLoading,
    error,
    updateProject,
    updateCompanyStatus,
    addCompanies,
    removeCompany,
    availableCompanies,
    isLoadingAvailableCompanies,
    refetch: fetchProject,
  }
}
