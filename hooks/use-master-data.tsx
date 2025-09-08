import { authService } from "@/lib/auth"
"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface Industry {
  id: number
  name: string
  display_order: number
  is_active: boolean
}

interface Status {
  id: number
  name: string
  category: string
  display_order: number
  color_code: string
  is_active: boolean
}

interface Prefecture {
  id: number
  name: string
  region: string
  display_order: number
}

export function useMasterData() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [prefectures, setPrefectures] = useState<Prefecture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 業界マスター取得
        const industriesResponse = await apiClient.get(API_CONFIG.ENDPOINTS.MASTER_INDUSTRIES)
        const industriesData = await apiClient.handleResponse<{results: Industry[]}>(industriesResponse)
        setIndustries(industriesData.results || [])

        // ステータスマスター取得
        const statusesResponse = await apiClient.get(API_CONFIG.ENDPOINTS.MASTER_STATUSES)
        const statusesData = await apiClient.handleResponse<{results: Status[]}>(statusesResponse)
        setStatuses(statusesData.results || [])

        // 都道府県マスター取得
        const prefecturesResponse = await apiClient.get(API_CONFIG.ENDPOINTS.MASTER_PREFECTURES)
        const prefecturesData = await apiClient.handleResponse<{results: Prefecture[]}>(prefecturesResponse)
        setPrefectures(prefecturesData.results || [])

      } catch (err) {
        console.error("Master data fetch failed:", err)
        setError(err instanceof Error ? err.message : "マスターデータの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  return {
    industries,
    statuses,
    prefectures,
    loading,
    error
  }
}