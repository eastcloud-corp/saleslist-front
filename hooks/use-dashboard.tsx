"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-config"

interface DashboardStats {
  totalCompanies: number
  activeProjects: number
  prospectCompanies: number
  completedDeals: number
}

interface RecentProject {
  id: number
  name: string
  status: string
  companies: number
  client_name: string
  updated_at: string
}

interface RecentCompany {
  id: number
  name: string
  industry: string
  status: string
  created_at: string
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeProjects: 0,
    prospectCompanies: 0,
    completedDeals: 0,
  })
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 統計データ取得
      const statsResponse = await apiClient.get("/dashboard/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // 最近のプロジェクト取得
      const projectsResponse = await apiClient.get("/dashboard/recent-projects")
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setRecentProjects(projectsData.results || [])
      }

      // 最近の企業取得
      const companiesResponse = await apiClient.get("/dashboard/recent-companies")
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json()
        setRecentCompanies(companiesData.results || [])
      }

    } catch (err) {
      console.error("[v0] ダッシュボードデータ取得エラー:", err)
      setError("ダッシュボードデータの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    stats,
    recentProjects,
    recentCompanies,
    loading,
    error,
    refetch: fetchDashboardData,
  }
}