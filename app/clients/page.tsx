"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useClients } from "@/hooks/use-clients"
import { apiClient } from "@/lib/api-client"
import { ClientTable } from "@/components/clients/client-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, TrendingUp, Users, FolderOpen } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { ListPaginationSummary } from "@/components/common/list-pagination-summary"

const DEFAULT_FILTERS = {
  search: "",
  industry: "all" as string,
  is_active: "all" as "all" | "true" | "false",
}

export default function ClientsPage() {
  const router = useRouter()
  const [industries, setIndustries] = useState<any[]>([])
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const computedFilters = useMemo(() => {
    const params: { [key: string]: string | boolean } = {}
    if (appliedFilters.search.trim()) {
      params.search = appliedFilters.search.trim()
    }
    if (appliedFilters.industry !== "all") {
      params.industry = appliedFilters.industry
    }
    if (appliedFilters.is_active === "true") {
      params.is_active = true
    }
    if (appliedFilters.is_active === "false") {
      params.is_active = false
    }
    return params
  }, [appliedFilters])

  const hasActiveFilters = useMemo(() => Object.keys(computedFilters).length > 0, [computedFilters])
  const filtersChanged = useMemo(
    () => JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters),
    [pendingFilters, appliedFilters]
  )

  const { clients, loading, error, pagination } = useClients({
    page: currentPage,
    limit: pageSize,
    filters: computedFilters,
  })

  // 業界マスター取得
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await apiClient.get<{results: string[]}>('/master/industries/')
        setIndustries(data.results || [])
      } catch (error) {
        console.error('Failed to fetch industries:', error)
      }
    }
    fetchIndustries()
  }, [])

  const clearFilters = () => {
    setPendingFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  const activeClients = clients.filter((client) => client.is_active).length
  const totalProjects = clients.reduce((sum, client) => sum + (client.project_count || 0), 0)
  const activeProjects = clients.reduce((sum, client) => sum + (client.active_project_count || 0), 0)
  const totalCount = pagination.total ?? clients.length
  const totalPages = pagination.total_pages ?? (pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">クライアント管理</h1>
            <p className="text-gray-600 mt-1">クライアント企業の情報と営業状況を効率的に管理</p>

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
                    value={pendingFilters.search}
                    onChange={(e) => setPendingFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">業界</label>
                <Select
                  value={pendingFilters.industry}
                  onValueChange={(value) => setPendingFilters((prev) => ({ ...prev, industry: value }))}
                >
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
                  value={pendingFilters.is_active}
                  onValueChange={(value) =>
                    setPendingFilters((prev) => ({ ...prev, is_active: value as typeof prev.is_active }))
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters} disabled={!hasActiveFilters && !filtersChanged}>
                    フィルタクリア
                  </Button>
                  <Button
                    onClick={() => {
                      setAppliedFilters({ ...pendingFilters })
                      setCurrentPage(1)
                    }}
                    disabled={!filtersChanged}
                  >
                    <Search className="mr-2 h-4 w-4" />検索
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ListPaginationSummary
          totalCount={totalCount}
          startItem={startItem}
          endItem={endItem}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          isLoading={loading}
        />

        <Card>
          <CardHeader>
            <CardTitle>クライアント一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">エラー: {error}</div>
            ) : (
              <ClientTable clients={clients} loading={loading} />
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <ListPaginationSummary
            totalCount={totalCount}
            startItem={startItem}
            endItem={endItem}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            isLoading={loading}
            className="mt-2"
          />
        )}
      </div>
    </MainLayout>
  )
}
