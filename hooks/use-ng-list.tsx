"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { ClientNGCompany, NGImportResult } from "@/lib/types"

export function useNGList(clientId: number) {
  const [ngList, setNgList] = useState<ClientNGCompany[]>([])
  const [stats, setStats] = useState({
    count: 0,
    matched_count: 0,
    unmatched_count: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNGList = async () => {
    console.log("[v0] Fetching NG list for client:", clientId)
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(`/clients/${clientId}/ng-companies`)
      const data = await apiClient.handleResponse(response) as any
      console.log("[v0] NG list response:", data)

      setNgList(data.results || [])
      setStats({
        count: data.count || 0,
        matched_count: data.matched_count || 0,
        unmatched_count: data.unmatched_count || 0,
      })
    } catch (err) {
      console.error("[v0] NG list fetch error:", err)
      setError("NGリストの取得に失敗しました")
      setNgList([])
      setStats({ count: 0, matched_count: 0, unmatched_count: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  const importCSV = async (file: File): Promise<NGImportResult> => {
    console.log("[v0] Importing NG list CSV:", file.name)

    try {
      // Use uploadFile method (same as working CSV implementation)
      const response = await apiClient.uploadFile(API_CONFIG.ENDPOINTS.NG_COMPANY_IMPORT(clientId), file)
      const data = await apiClient.handleResponse<NGImportResult>(response)

      await fetchNGList() // リスト再取得
      return data
    } catch (err) {
      console.error("[v0] CSV import error:", err)
      throw new Error("CSVインポートに失敗しました")
    }
  }

  const deleteNG = async (ngId: number) => {
    console.log("[v0] Deleting NG company:", ngId)

    try {
      const response = await apiClient.delete(`/clients/${clientId}/ng-companies/${ngId}`)
      await apiClient.handleResponse(response)
      await fetchNGList()
    } catch (err) {
      console.error("[v0] NG delete error:", err)
      throw new Error("NG企業の削除に失敗しました")
    }
  }

  const addCompanyToNG = async (companyId: number, companyName: string, reason: string) => {
    console.log("[v0] Adding company to NG list:", { companyId, companyName, reason })

    try {
      const response = await apiClient.post(`/clients/${clientId}/ng-companies/add/`, {
        company_id: companyId,
        company_name: companyName,
        reason: reason,
      })
      await apiClient.handleResponse(response)
      await fetchNGList()
    } catch (err) {
      console.error("[v0] NG company add error:", err)
      throw new Error("NG企業の追加に失敗しました")
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchNGList()
    }
  }, [clientId])

  return {
    ngList,
    stats,
    isLoading,
    error,
    importCSV,
    deleteNG,
    addCompanyToNG,
    refetch: fetchNGList,
  }
}
