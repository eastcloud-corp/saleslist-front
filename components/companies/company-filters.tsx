"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Plus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import type { Company, CompanyFilter, PaginatedResponse } from "@/lib/types"
import { INDUSTRY_SUGGESTIONS } from "@/constants/industry-options"

const ROLE_CATEGORIES = [
  { value: "leadership", label: "代表・CEO" },
  { value: "board", label: "取締役・ボード" },
  { value: "executive", label: "執行役員・本部長" },
  { value: "c_suite", label: "CxO・経営陣" },
  { value: "advisor", label: "顧問・アドバイザー" },
  { value: "other", label: "その他" },
]

interface CompanyFiltersProps {
  filters: CompanyFilter
  onFiltersChange: (filters: CompanyFilter) => void
  onClearFilters: () => void
  onApplyFilters: () => void
  filtersChanged: boolean
  hasAppliedFilters: boolean
}

export function CompanyFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
  filtersChanged,
  hasAppliedFilters,
}: CompanyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [industries, setIndustries] = useState<string[]>([])
  const [industryQuery, setIndustryQuery] = useState("")
  const [isIndustryFocused, setIsIndustryFocused] = useState(false)

  useEffect(() => {
    // 実際のデータから業界一覧を取得
    const fetchIndustries = async () => {
      try {
        const data = await apiClient.get<{ results?: { name?: string }[] }>(API_CONFIG.ENDPOINTS.MASTER_INDUSTRIES)
        const uniqueIndustries = data.results
          ?.map((item) => item.name)
          .filter((name): name is string => Boolean(name)) || []
        setIndustries(Array.from(new Set(uniqueIndustries)).sort())
      } catch (primaryError) {
        console.error('[filters] 業界候補取得に失敗しました:', primaryError)
        try {
          const fallback = await apiClient.get<PaginatedResponse<Company>>(API_CONFIG.ENDPOINTS.COMPANIES)
          const uniqueIndustries = fallback.results
            ?.map((company) => company.industry)
            .filter((industry): industry is string => Boolean(industry)) || []
          setIndustries(Array.from(new Set(uniqueIndustries)).sort())
        } catch (secondaryError) {
          console.error('[filters] 業界候補のフォールバック取得にも失敗しました:', secondaryError)
          setIndustries([])
        }
      }
    }

    fetchIndustries()
  }, [])

  const updateFilter = (key: keyof CompanyFilter, value: CompanyFilter[keyof CompanyFilter]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toArray = (input: CompanyFilter[keyof CompanyFilter]): string[] => {
    if (!input) return []
    if (Array.isArray(input)) return input.filter((item): item is string => typeof item === "string")
    if (typeof input === "string" && input.length > 0) return [input]
    return []
  }

  const addArrayFilter = (key: keyof CompanyFilter, value: string) => {
    const currentArray = toArray(filters[key])
    if (!currentArray.includes(value)) {
      updateFilter(key, [...currentArray, value] as CompanyFilter[keyof CompanyFilter])
    }
  }

  const removeArrayFilter = (key: keyof CompanyFilter, value: string) => {
    const currentArray = toArray(filters[key])
    updateFilter(
      key,
      currentArray.filter((item) => item !== value) as CompanyFilter[keyof CompanyFilter],
    )
  }

  const combinedIndustryOptions = useMemo(() => {
    const dynamicOptions = industries.filter((option): option is string => Boolean(option))
    const merged = [...INDUSTRY_SUGGESTIONS, ...dynamicOptions]
    return Array.from(new Set(merged))
  }, [industries])

  const selectedIndustries = toArray(filters.industry)
  const availableIndustryOptions = useMemo(
    () => combinedIndustryOptions.filter((option) => !selectedIndustries.includes(option)),
    [combinedIndustryOptions, selectedIndustries],
  )

  const filteredIndustryOptions = useMemo(() => {
    const normalizedQuery = industryQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return availableIndustryOptions.slice(0, 15)
    }
    return availableIndustryOptions
      .filter((option) => option.toLowerCase().includes(normalizedQuery))
      .slice(0, 15)
  }, [availableIndustryOptions, industryQuery])

  const handleIndustrySelect = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    addArrayFilter("industry", trimmed)
    setIndustryQuery("")
    setIsIndustryFocused(false)
  }

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0
    }
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== undefined && value !== null
  })

  const showIndustryDropdown = (isIndustryFocused || Boolean(industryQuery.trim())) && filteredIndustryOptions.length > 0

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            検索・フィルター
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            <Filter className="h-4 w-4 mr-1" />
            {isExpanded ? "フィルターを隠す" : "フィルターを表示"}
          </Button>
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
          <div className="grid grid-cols-1 gap-4 pt-4 border-t md:grid-cols-2 lg:grid-cols-3">
            {/* Industry Filter */}
            <div>
              <Label>業界</Label>
              <div className="flex items-start gap-2">
                <div className="relative flex-1">
                  <Input
                    value={industryQuery}
                    placeholder="業界を入力または選択..."
                    onChange={(event) => setIndustryQuery(event.target.value)}
                    onFocus={() => setIsIndustryFocused(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsIndustryFocused(false), 120)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleIndustrySelect(industryQuery)
                      }
                      if (event.key === "Escape") {
                        setIndustryQuery("")
                        setIsIndustryFocused(false)
                      }
                    }}
                  />
                  {showIndustryDropdown && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
                      <ul className="max-h-56 overflow-auto py-1 text-sm">
                        {filteredIndustryOptions.map((option) => (
                          <li key={option}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleIndustrySelect(option)
                              }}
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleIndustrySelect(industryQuery)}
                  disabled={!industryQuery.trim()}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  追加
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {toArray(filters.industry).map((industry) => (
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

            {/* Role Category */}
            <div>
              <Label>役職カテゴリ</Label>
              <Select onValueChange={(value) => addArrayFilter("role_category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="役職カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {toArray(filters.role_category).map((category) => {
                  const label = ROLE_CATEGORIES.find((item) => item.value === category)?.label || category
                  return (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {label}
                      <button
                        onClick={() => removeArrayFilter("role_category", category)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Employee Count */}
            <div>
              <Label>従業員数</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="最小"
                  type="number"
                  value={filters.employee_min ?? ""}
                  onChange={(e) =>
                    updateFilter(
                      "employee_min",
                      e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                    )
                  }
                />
                <Input
                  placeholder="最大"
                  type="number"
                  value={filters.employee_max ?? ""}
                  onChange={(e) =>
                    updateFilter(
                      "employee_max",
                      e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                    )
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

          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {hasActiveFilters ? (
              <>
                <Filter className="h-3 w-3" />
                <span>現在 {hasAppliedFilters ? '適用済みの' : ''}フィルターが有効です</span>
              </>
            ) : (
              <span>フィルターは未選択です</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={!hasAppliedFilters && !filtersChanged}
            >
              <X className="h-3 w-3 mr-1" />
              すべてクリア
            </Button>
            <Button size="sm" onClick={onApplyFilters} disabled={!filtersChanged}>
              <Search className="h-3 w-3 mr-1" />検索
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { CompanyFilters as CompanyFilterComponent }
