"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useClients } from "@/hooks/use-clients"
import { ClientTable } from "@/components/clients/client-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"

export default function ClientsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    search: "",
    industry: "all", // Updated default value to 'all'
    is_active: undefined as boolean | undefined,
  })

  const { clients, loading, error, pagination } = useClients({
    page: 1,
    limit: 100,
    filters,
  })

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      industry: "all", // Updated default value to 'all'
      is_active: undefined,
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">クライアント管理</h1>
            <p className="text-gray-600">営業代行を依頼するクライアント企業を管理します</p>
          </div>
          <Button onClick={() => router.push("/clients/new")}>
            <Plus className="mr-2 h-4 w-4" />
            クライアント追加
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
                    <SelectItem value="IT・ソフトウェア">IT・ソフトウェア</SelectItem>
                    <SelectItem value="マーケティング・広告">マーケティング・広告</SelectItem>
                    <SelectItem value="製造業">製造業</SelectItem>
                    <SelectItem value="金融・保険">金融・保険</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ステータス</label>
                <Select
                  value={filters.is_active?.toString() || "all"} // Updated default value to 'all'
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
