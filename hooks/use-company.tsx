"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-config"
import { authService } from "@/lib/auth"
import type { Company, ApiResponse } from "@/lib/types"

export function useCompany(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (!authService.isAuthenticated()) { 
          setIsLoading(false) 
          return 
        }
    setIsLoading(true)
        setError(null)

        console.log("[useCompany] Fetching company:", companyId)
        const response = await apiClient.get(`/companies/${companyId}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data: ApiResponse<Company> = await response.json()
        setCompany(data.data || data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "企業データの取得に失敗しました")
        console.error("[useCompany] Error fetching company:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchCompany()
    }
  }, [companyId])

  const updateCompany = async (companyData: Partial<Company>) => {
    try {
      if (!authService.isAuthenticated()) { setIsLoading(false); return; }
    setIsLoading(true)
      setError(null)

      const response = await apiClient.put(`/companies/${companyId}/`, companyData)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<Company> = await response.json()
      setCompany(data.data || data)
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "企業データの更新に失敗しました")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCompany = async () => {
    try {
      if (!authService.isAuthenticated()) { setIsLoading(false); return; }
    setIsLoading(true)
      setError(null)

      const response = await apiClient.delete(`/companies/${companyId}/`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "企業の削除に失敗しました")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { company, isLoading, error, updateCompany, deleteCompany }
}