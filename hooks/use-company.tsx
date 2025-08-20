"use client"

import { useState, useEffect } from "react"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import type { Company, ApiResponse } from "@/lib/types"
import { authService } from "@/lib/auth"

export function useCompany(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompany = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.COMPANY_DETAIL(companyId), {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch company")
      }

      const data: ApiResponse<Company> = await response.json()
      setCompany(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      // Mock data for development
      setCompany({
        id: companyId,
        name: "Tech Solutions Inc.",
        industry: "Technology",
        employee_count: 150,
        revenue: 5000000,
        location: "Tokyo, Japan",
        website: "https://techsolutions.com",
        phone: "+81-3-1234-5678",
        email: "contact@techsolutions.com",
        description:
          "Leading technology solutions provider specializing in enterprise software development and digital transformation services.",
        status: "active",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        executives: [
          {
            id: "1",
            company_id: companyId,
            name: "Takeshi Yamamoto",
            position: "CEO",
            email: "t.yamamoto@techsolutions.com",
            phone: "+81-3-1234-5679",
            linkedin_url: "https://linkedin.com/in/takeshi-yamamoto",
            facebook_url: "",
            twitter_url: "",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
          {
            id: "2",
            company_id: companyId,
            name: "Hiroshi Tanaka",
            position: "CTO",
            email: "h.tanaka@techsolutions.com",
            phone: "+81-3-1234-5680",
            linkedin_url: "https://linkedin.com/in/hiroshi-tanaka",
            facebook_url: "",
            twitter_url: "",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCompany = async (updatedData: Partial<Company>) => {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.COMPANY_DETAIL(companyId), updatedData, {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to update company")
      }

      const data: ApiResponse<Company> = await response.json()
      setCompany(data.data)
      return data.data
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  const deleteCompany = async () => {
    try {
      const response = await apiClient.delete(API_CONFIG.ENDPOINTS.COMPANY_DETAIL(companyId), {
        headers: authService.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to delete company")
      }

      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }

  useEffect(() => {
    if (companyId) {
      fetchCompany()
    }
  }, [companyId])

  return {
    company,
    isLoading,
    error,
    updateCompany,
    deleteCompany,
    refetch: fetchCompany,
  }
}
