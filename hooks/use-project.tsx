import { authService } from "@/lib/auth"
"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-config"
import type { Project, ApiResponse } from "@/lib/types"

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    try {
      if (!authService.isAuthenticated()) { setIsLoading(false); return; }
    setIsLoading(true)
      setError(null)

      console.log("[useProject] Fetching project:", projectId)
      const response = await apiClient.get(`/projects/${projectId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<Project> = await response.json()
      console.log("[useProject] Project data:", data)
      
      // Handle both wrapped and unwrapped responses
      const projectData = data.data || data
      setProject(projectData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロジェクトデータの取得に失敗しました")
      console.error("[useProject] Error fetching project:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const updateProject = async (data: Partial<Project>) => {
    try {
      console.log("[useProject] Updating project:", projectId, data)
      const response = await apiClient.put(`/projects/${projectId}`, data)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const updatedProject: ApiResponse<Project> = await response.json()
      const projectData = updatedProject.data || updatedProject
      setProject(projectData)
      
      console.log("[useProject] Project updated successfully")
    } catch (err) {
      console.error("[useProject] Error updating project:", err)
      throw err
    }
  }

  const updateCompanyStatus = async (companyId: string, status: string, notes?: string) => {
    try {
      console.log("[useProject] Updating company status:", { projectId, companyId, status, notes })
      
      // Update project company status via API
      const response = await apiClient.put(`/projects/${projectId}/companies/${companyId}`, {
        status,
        notes
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Refresh project data to get updated company statuses
      await fetchProject()
      
      console.log("[useProject] Company status updated successfully")
    } catch (err) {
      console.error("[useProject] Error updating company status:", err)
      throw err
    }
  }

  const removeCompany = async (companyId: string) => {
    try {
      console.log("[useProject] Removing company from project:", { projectId, companyId })
      
      const response = await apiClient.delete(`/projects/${projectId}/companies/${companyId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Refresh project data to reflect removal
      await fetchProject()
      
      console.log("[useProject] Company removed successfully")
    } catch (err) {
      console.error("[useProject] Error removing company:", err)
      throw err
    }
  }

  return {
    project,
    isLoading,
    error,
    updateProject,
    updateCompanyStatus,
    removeCompany,
    refetch: fetchProject,
  }
}