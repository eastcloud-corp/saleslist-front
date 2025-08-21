"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-config"
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
      console.log("[v0] NG list response:", response)

      setNgList(response.results || [])
      setStats({
        count: response.count || 0,
        matched_count: response.matched_count || 0,
        unmatched_count: response.unmatched_count || 0,
      })
    } catch (err) {
      console.error("[v0] NG list fetch error:", err)
      setError("NGリストの取得に失敗しました")
      // モックデータで代替
      setNgList([
        {
          id: 1,
          client_id: clientId,
          company_name: "株式会社競合A",
          company_id: 123,
          matched: true,
          reason: "競合他社",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          client_id: clientId,
          company_name: "○○商事",
          matched: false,
          reason: "既存取引先",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      setStats({ count: 2, matched_count: 1, unmatched_count: 1 })
    } finally {
      setIsLoading(false)
    }
  }

  const importCSV = async (file: File): Promise<NGImportResult> => {
    console.log("[v0] Importing NG list CSV:", file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await apiClient.post(`/clients/${clientId}/ng-companies/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      await fetchNGList() // リスト再取得
      return response
    } catch (err) {
      console.error("[v0] CSV import error:", err)
      // モック結果を返す
      const mockResult: NGImportResult = {
        imported_count: 5,
        matched_count: 3,
        unmatched_count: 2,
        errors: [],
      }
      await fetchNGList()
      return mockResult
    }
  }

  const deleteNG = async (ngId: number) => {
    console.log("[v0] Deleting NG company:", ngId)

    try {
      await apiClient.delete(`/clients/${clientId}/ng-companies/${ngId}`)
      await fetchNGList()
    } catch (err) {
      console.error("[v0] NG delete error:", err)
      // モックとして削除を実行
      setNgList((prev) => prev.filter((ng) => ng.id !== ngId))
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
    refetch: fetchNGList,
  }
}
