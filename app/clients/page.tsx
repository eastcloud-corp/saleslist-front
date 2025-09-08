"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useClients } from "@/hooks/use-clients"
import { apiClient } from "@/lib/api-config"
import { ClientTable } from "@/components/clients/client-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, TrendingUp, Users, FolderOpen } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"

export default function ClientsPage() {
  const router = useRouter()
  const [industries, setIndustries] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: "",
    industry: undefined as string | undefined,
    is_active: undefined as boolean | undefined,
  })

  const { clients, loading, error, pagination } = useClients({
    page: 1,
    limit: 100,
    filters,
  })

  // 業界マスター取得
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await apiClient.get('/master/industries/')
        setIndustries(data.results || [])
      } catch (error) {
        console.error('Failed to fetch industries:', error)
      }
    }
    fetchIndustries()
  }, [])

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      industry: undefined,
      is_active: undefined,
    })
  }

  const activeClients = clients.filter((client) => client.is_active).length
  const totalProjects = clients.reduce((sum, client) => sum + (client.project_count || 0), 0)
  const activeProjects = clients.reduce((sum, client) => sum + (client.active_project_count || 0), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">営業管理システム</h1>
            <p className="text-gray-600 mt-1">クライアント企業の営業代行業務を効率的に管理</p>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  アクティブクライアント: <span className="font-medium text-gray-900">{activeClients}社</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  進行中案件: <span className="font-medium text-gray-900">{activeProjects}件</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">
                  総案件数: <span className="font-medium text-gray-900">{totalProjects}件</span>
                </span>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push("/clients/new")} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            新規クライアント登録
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              検索・フィルタ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">クライアント名</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="クライアント名で検索"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">業界</label>
                <Select value={filters.industry} onValueChange={(value) => handleFilterChange("industry", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="業界を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.name}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ステータス</label>
                <Select
                  value={filters.is_active?.toString() || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("is_active", value === "all" ? undefined : value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="true">アクティブ</SelectItem>
                    <SelectItem value="false">非アクティブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  フィルタクリア
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クライアント一覧 ({pagination.total}件)</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">エラー: {error}</div>
            ) : (
              <ClientTable clients={clients} loading={loading} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
