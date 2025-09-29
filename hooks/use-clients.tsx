"use client"

import { useState, useEffect } from "react"
import type { Client, Project } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface ClientFilters {
  search?: string
  industry?: string
  is_active?: boolean
  has_projects?: boolean
  created_from?: string
  created_to?: string
}

interface UseClientsOptions {
  page?: number
  limit?: number
  filters?: ClientFilters
}

const isProduction = process.env.NODE_ENV === "production"
const CLIENTS_ENDPOINT = API_CONFIG.ENDPOINTS.CLIENTS
const debugLog = (...args: unknown[]) => {
  if (!isProduction) {
    console.log("[useClients]", ...args)
  }
}
const debugWarn = (...args: unknown[]) => {
  if (!isProduction) {
    console.warn("[useClients]", ...args)
  }
}

export function useClients(options: UseClientsOptions = {}) {
  const { page = 1, limit = 50, filters = {} } = options
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 1,
  })

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: limit.toString(),
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === "") return
        if (key === "industry" && value === "all") return
        params.append(key, String(value))
      })

      type ClientListResponse = { results?: Client[]; count?: number } | Client[]

      const baseEndpoint = CLIENTS_ENDPOINT.endsWith("/")
        ? CLIENTS_ENDPOINT.slice(0, -1)
        : CLIENTS_ENDPOINT

      const endpoint = `${baseEndpoint}?${params.toString()}`

      const data = await apiClient.get<ClientListResponse>(endpoint)
      debugLog("APIレスポンス構造", data)
      
      const isPaginatedResponse = (value: ClientListResponse): value is { results: Client[]; count?: number } => {
        return !Array.isArray(value) && Array.isArray((value as { results?: Client[] }).results)
      }

      if (isPaginatedResponse(data)) {
        setClients(data.results)
        const total = typeof data.count === 'number' ? data.count : data.results.length
        setPagination({
          page,
          limit,
          total,
          total_pages: Math.max(1, Math.ceil(total / limit)),
        })
      } else if (Array.isArray(data)) {
        setClients(data)
        setPagination({
          page,
          limit,
          total: data.length,
          total_pages: Math.max(1, Math.ceil(data.length / limit)),
        })
      } else {
        debugWarn("Unexpected response format", data)
        setError("予期しないAPIレスポンス形式")
      }
    } catch (err) {
      console.error("[useClients] クライアント一覧取得エラー", err);
      setError(err instanceof Error ? err.message : "クライアント一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients()
  }, [page, limit, JSON.stringify(filters)])

  const createClient = async (clientData: Omit<Client, "id" | "created_at" | "updated_at">) => {
    try {
      debugLog("クライアント作成", clientData)

      const newClient = await apiClient.post<Client>(CLIENTS_ENDPOINT, clientData)
      debugLog("クライアント作成成功", newClient)
      await fetchClients() // リストを再取得
    } catch (err) {
      console.error("[useClients] クライアント作成エラー", err)
      throw err
    }
  }

  const updateClient = async (id: number, clientData: Partial<Client>) => {
    try {
      debugLog("クライアント更新", { id, clientData })

      const endpoint = `${CLIENTS_ENDPOINT}${id}/`
      const updatedClient = await apiClient.put<Client>(endpoint, clientData)
      debugLog("クライアント更新成功", updatedClient)
      await fetchClients() // リストを再取得
    } catch (err) {
      console.error("[useClients] クライアント更新エラー", err)
      throw err
    }
  }

  return {
    clients,
    loading,
    error,
    pagination,
    refetch: fetchClients,
    createClient,
    updateClient,
  }
}

export function useClient(id: number) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError(null)

      debugLog("クライアント詳細を取得", { id })
      const endpoint = `${CLIENTS_ENDPOINT}${id}/`
      const data = await apiClient.get<Client>(endpoint)
      debugLog("クライアント詳細取得成功", data)

      if (data && data.id) {
        setClient(data)
      } else {
        setError("クライアント詳細データが見つかりません")
      }
    } catch (err) {
      console.error("[useClients] クライアント詳細取得エラー", err)
      setError(err instanceof Error ? err.message : "クライアント詳細の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
  }
}

export function useClientStats(id: number) {
  const [stats, setStats] = useState<{
    project_count: number
    active_project_count: number
    completed_project_count: number
    total_companies: number
    total_contacted: number
    success_rate: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      debugLog("クライアント統計情報を取得", { id })

      const endpoint = `${CLIENTS_ENDPOINT}${id}/stats`
      const data = await apiClient.get<Record<string, unknown> | null>(endpoint)
      debugLog("クライアント統計情報取得成功", data)

      if (data) {
        setStats(data as any)
      } else {
        setError("統計情報が見つかりません")
      }
    } catch (err) {
      console.error("[useClients] クライアント統計情報取得エラー", err)
      setError(err instanceof Error ? err.message : "統計情報の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchStats()
    }
  }, [id])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

export function useClientProjects(id: number) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      debugLog("クライアント関連案件を取得", { id })

      type ClientProjectsResponse = { results?: Project[] } | Project[]
      const endpoint = `${CLIENTS_ENDPOINT}${id}/projects`
      const data = await apiClient.get<ClientProjectsResponse>(endpoint)
      debugLog("クライアント関連案件取得成功", data)

      if (!Array.isArray(data) && Array.isArray((data as { results?: Project[] }).results)) {
        setProjects((data as { results: Project[] }).results)
      } else if (Array.isArray(data)) {
        setProjects(data)
      } else {
        setError("関連案件データが見つかりません")
      }
    } catch (err) {
      console.error("[useClients] クライアント関連案件取得エラー", err)
      setError(err instanceof Error ? err.message : "関連案件の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchProjects()
    }
  }, [id])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  }
}
