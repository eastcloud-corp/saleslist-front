"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface CompanyFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
}

const statuses = [
  { value: "active", label: "アクティブ" },
  { value: "prospect", label: "見込み客" },
  { value: "inactive", label: "非アクティブ" },
]

export function CompanyFilters({ filters, onFiltersChange, onClearFilters }: CompanyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [industries, setIndustries] = useState<string[]>([])

  useEffect(() => {
    // 実際のデータから業界一覧を取得
    const fetchIndustries = async () => {
      try {
        const data = await apiClient.get<{results: {industry: string}[]}>('/companies/')
        const uniqueIndustries = [...new Set(data.results.map((company) => company.industry).filter(Boolean))] as string[]
        setIndustries(uniqueIndustries.sort())
      } catch (error) {
        console.error('API接続エラー:', error)
        // エラー状態のまま（空配列）でUI上でエラー表示
      }
    }
    
    fetchIndustries()
  }, [])

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const addArrayFilter = (key: string, value: string) => {
    const currentArray = (filters[key] as string[]) || []
    if (!currentArray.includes(value)) {
      updateFilter(key, [...currentArray, value])
    }
  }

  const removeArrayFilter = (key: string, value: string) => {
    const currentArray = (filters[key] as string[]) || []
    updateFilter(
      key,
      currentArray.filter((item) => item !== value),
    )
  }

  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "",
  )

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            検索・フィルター
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs bg-transparent">
                <X className="h-3 w-3 mr-1" />
                すべてクリア
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? "フィルターを隠す" : "フィルターを表示"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">企業検索</Label>
          <Input
            id="search"
            placeholder="企業名、業界、所在地で検索..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Industry Filter */}
            <div>
              <Label>業界</Label>
              <Select onValueChange={(value) => addArrayFilter("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="業界を選択" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.industry?.map((industry: string) => (
                  <Badge key={industry} variant="secondary" className="text-xs">
                    {industry}
                    <button
                      onClick={() => removeArrayFilter("industry", industry)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Employee Count */}
            <div>
              <Label>従業員数</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="最小"
                  type="number"
                  value={filters.employee_count_min || ""}
                  onChange={(e) =>
                    updateFilter("employee_count_min", e.target.value ? Number.parseInt(e.target.value) : undefined)
                  }
                />
                <Input
                  placeholder="最大"
                  type="number"
                  value={filters.employee_count_max || ""}
                  onChange={(e) =>
                    updateFilter("employee_count_max", e.target.value ? Number.parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            </div>

            {/* Revenue */}
            <div>
              <Label>売上 (¥)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="最小"
                  type="number"
                  value={filters.revenue_min || ""}
                  onChange={(e) =>
                    updateFilter("revenue_min", e.target.value ? Number.parseInt(e.target.value) : undefined)
                  }
                />
                <Input
                  placeholder="最大"
                  type="number"
                  value={filters.revenue_max || ""}
                  onChange={(e) =>
                    updateFilter("revenue_max", e.target.value ? Number.parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>ステータス</Label>
              <Select onValueChange={(value) => addArrayFilter("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.status?.map((status: string) => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    {statuses.find((s) => s.value === status)?.label || status}
                    <button onClick={() => removeArrayFilter("status", status)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { CompanyFilters as CompanyFilterComponent }
