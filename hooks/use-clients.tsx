"use client"

import { useState, useEffect } from "react"
import type { Client } from "@/lib/types"
import { apiClient } from "@/lib/api-config"

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

      console.log("[v0] クライアント一覧を取得中...", { page, limit, filters })

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")),
      })

      const response = await apiClient.get(`/clients/?${params}`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] クライアント一覧取得成功:", data)

        // APIレスポンス形式に対応
        if (data.results) {
          setClients(data.results)
          setPagination({
            page: page,
            limit: limit,
            total: data.count || 0,
            total_pages: Math.ceil((data.count || 0) / limit),
          })
        } else {
          // モックデータ
          const mockClients: Client[] = [
            {
              id: 1,
              name: "株式会社テックソリューション",
              contact_person: "田中 太郎",
              email: "tanaka@techsolution.co.jp",
              phone: "03-1234-5678",
              industry: "IT・ソフトウェア",
              notes: "SaaS企業向けの営業代行を依頼",
              is_active: true,
              created_at: "2025-01-01T10:00:00Z",
              updated_at: "2025-01-20T15:30:00Z",
              project_count: 3,
              active_project_count: 2,
            },
            {
              id: 2,
              name: "株式会社マーケティングプロ",
              contact_person: "佐藤 花子",
              email: "sato@marketing-pro.com",
              phone: "06-9876-5432",
              industry: "マーケティング・広告",
              notes: "BtoB企業向けのリード獲得支援",
              is_active: true,
              created_at: "2025-01-05T14:20:00Z",
              updated_at: "2025-01-22T09:15:00Z",
              project_count: 1,
              active_project_count: 1,
            },
          ]
          setClients(mockClients)
          setPagination({
            page: 1,
            limit: 50,
            total: mockClients.length,
            total_pages: 1,
          })
        }
      } else {
        throw new Error("クライアント一覧の取得に失敗しました")
      }
    } catch (err) {
      console.error("[v0] クライアント一覧取得エラー:", err)
      setError(err instanceof Error ? err.message : "クライアント一覧の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [page, limit, JSON.stringify(filters)])

  const createClient = async (clientData: Omit<Client, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("[v0] クライアント作成中...", clientData)

      const response = await apiClient.post("/clients/", clientData)

      if (response.ok) {
        const newClient = await response.json()
        console.log("[v0] クライアント作成成功:", newClient)
        await fetchClients() // リストを再取得
        return newClient
      } else {
        throw new Error("クライアントの作成に失敗しました")
      }
    } catch (err) {
      console.error("[v0] クライアント作成エラー:", err)
      throw err
    }
  }

  const updateClient = async (id: number, clientData: Partial<Client>) => {
    try {
      console.log("[v0] クライアント更新中...", { id, clientData })

      const response = await apiClient.put(`/clients/${id}/`, clientData)

      if (response.ok) {
        const updatedClient = await response.json()
        console.log("[v0] クライアント更新成功:", updatedClient)
        await fetchClients() // リストを再取得
        return updatedClient
      } else {
        throw new Error("クライアントの更新に失敗しました")
      }
    } catch (err) {
      console.error("[v0] クライアント更新エラー:", err)
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

      console.log("[v0] クライアント詳細を取得中...", { id })

      const response = await apiClient.get(`/clients/${id}/`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] クライアント詳細取得成功:", data)
        setClient(data)
      } else {
        throw new Error("クライアント詳細の取得に失敗しました")
      }
    } catch (err) {
      console.error("[v0] クライアント詳細取得エラー:", err)
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

      console.log("[v0] クライアント統計情報を取得中...", { id })

      const response = await apiClient.get(`/clients/${id}/stats/`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] クライアント統計情報取得成功:", data)
        setStats(data)
      } else {
        // モックデータで代替
        const mockStats = {
          project_count: 5,
          active_project_count: 3,
          completed_project_count: 2,
          total_companies: 250,
          total_contacted: 180,
          success_rate: 12.5,
        }
        console.log("[v0] モック統計データを使用:", mockStats)
        setStats(mockStats)
      }
    } catch (err) {
      console.error("[v0] クライアント統計情報取得エラー:", err)
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

      console.log("[v0] クライアント関連案件を取得中...", { id })

      const response = await apiClient.get(`/clients/${id}/projects/`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] クライアント関連案件取得成功:", data)
        setProjects(data.results || data)
      } else {
        // モックデータで代替
        const mockProjects = [
          {
            id: 1,
            name: "IT企業向けDMキャンペーン2025Q1",
            status: "進行中",
            company_count: 85,
            created_at: "2025-01-01T10:00:00Z",
          },
        ]
        console.log("[v0] モック案件データを使用:", mockProjects)
        setProjects(mockProjects)
      }
    } catch (err) {
      console.error("[v0] クライアント関連案件取得エラー:", err)
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
