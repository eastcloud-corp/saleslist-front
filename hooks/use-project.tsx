"use client"

import { useState, useEffect } from "react"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import type { Project, ApiResponse } from "@/lib/types"
import { authService } from "@/lib/auth"

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROJECT_DETAIL(projectId), {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch project")
      }

      const data: ApiResponse<Project> = await response.json()
      setProject(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      // Mock data for development
      setProject({
        id: projectId,
        name: "Q1 2024 Enterprise Outreach",
        description: "Target large enterprise companies for our new software solution",
        status: "active",
        start_date: "2024-01-01",
        end_date: "2024-03-31",
        created_by: "user1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        companies: [
          {
            id: "pc1",
            project_id: projectId,
            company_id: "1",
            status: "contacted",
            notes: "Initial contact made, waiting for response",
            contact_date: "2024-01-15",
            follow_up_date: "2024-01-22",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
            company: {
              id: "1",
              name: "Tech Solutions Inc.",
              industry: "Technology",
              employee_count: 150,
              revenue: 5000000,
              location: "Tokyo, Japan",
              website: "https://techsolutions.com",
              phone: "+81-3-1234-5678",
              email: "contact@techsolutions.com",
              description: "Leading technology solutions provider",
              status: "active",
              created_at: "2024-01-15T10:00:00Z",
              updated_at: "2024-01-15T10:00:00Z",
              executives: [],
            },
          },
          {
            id: "pc2",
            project_id: projectId,
            company_id: "2",
            status: "interested",
            notes: "Showed strong interest, scheduled demo for next week",
            contact_date: "2024-01-10",
            follow_up_date: "2024-01-17",
            created_at: "2024-01-10T14:30:00Z",
            updated_at: "2024-01-12T09:15:00Z",
            company: {
              id: "2",
              name: "Global Manufacturing Co.",
              industry: "Manufacturing",
              employee_count: 500,
              revenue: 25000000,
              location: "Osaka, Japan",
              website: "https://globalmanufacturing.com",
              phone: "+81-6-9876-5432",
              email: "info@globalmanufacturing.com",
              description: "International manufacturing company",
              status: "prospect",
              created_at: "2024-01-10T14:30:00Z",
              updated_at: "2024-01-10T14:30:00Z",
              executives: [],
            },
          },
        ],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateProject = async (updatedData: Partial<Project>) => {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.PROJECT_DETAIL(projectId), updatedData, {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to update project")
      }

      const data: ApiResponse<Project> = await response.json()
      setProject(data.data)
      return data.data
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  const updateCompanyStatus = async (companyId: string, status: string, notes?: string) => {
    try {
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.PROJECT_COMPANIES(projectId)}/${companyId}`,
        { status, notes },
        {
          headers: authService.getAuthHeaders(),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to update company status")
      }

      await fetchProject() // Refresh project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  const addCompanyToProject = async (companyId: string) => {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.PROJECT_COMPANIES(projectId),
        { company_id: companyId },
        {
          headers: authService.getAuthHeaders(),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to add company to project")
      }

      await fetchProject() // Refresh project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  const removeCompanyFromProject = async (companyId: string) => {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.PROJECT_COMPANIES(projectId)}/${companyId}`, {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to remove company from project")
      }

      await fetchProject() // Refresh project data
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  return {
    project,
    isLoading,
    error,
    updateProject,
    updateCompanyStatus,
    addCompanyToProject,
    removeCompanyFromProject,
    refetch: fetchProject,
  }
}
