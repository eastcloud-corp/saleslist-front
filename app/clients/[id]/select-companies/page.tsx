"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Filter, Plus, AlertTriangle, ExternalLink, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useClient } from "@/hooks/use-clients"
import type { Company, CompanyFilter } from "@/lib/types"
import { apiClient } from "@/lib/api-config"
import { API_CONFIG } from "@/lib/api-config"
import { Switch } from "@/components/ui/switch"

interface IndustryHierarchy {
  id: number
  name: string
  is_category: boolean
  sub_industries: IndustryHierarchy[]
}

const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "-"
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatEmployeeCount = (count?: number | null) => {
  if (count === null || count === undefined || Number.isNaN(Number(count))) {
    return "-"
  }
  return new Intl.NumberFormat("ja-JP").format(count)
}

const getStatusBadge = (status?: string) => {
  const variants = {
    active: "default",
    prospect: "secondary",
    inactive: "outline",
  } as const

  const statusLabels = {
    active: "アクティブ",
    prospect: "見込み客",
    inactive: "非アクティブ",
  } as const

  const statusValue = status || "active"
  return (
    <Badge variant={variants[statusValue as keyof typeof variants] || "outline"}>
      {statusLabels[statusValue as keyof typeof statusLabels] || statusValue}
    </Badge>
  )
}

export default function CompanySelectionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = Number.parseInt(params.id as string)

  const { client, loading: clientLoading } = useClient(clientId)

  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<CompanyFilter>({
    page: 1,
    page_size: 100,
    exclude_ng: false,
    ordering: 'name',
  })
  const [totalCount, setTotalCount] = useState(0)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [isAddingToProject, setIsAddingToProject] = useState(false)
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [industryHierarchy, setIndustryHierarchy] = useState<IndustryHierarchy[]>([])
  const [industryQuery, setIndustryQuery] = useState("")
  const [isIndustryFocused, setIsIndustryFocused] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const industryInputRef = useRef<HTMLInputElement>(null)

  const industryValue = Array.isArray(filters.industry) ? filters.industry[0] : filters.industry

  useEffect(() => {
    // 階層構造の業界データを取得
    const fetchIndustries = async () => {
      try {
        const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.MASTER_INDUSTRIES}?hierarchy=true`)
        const hierarchyData = await response.json() as { results?: IndustryHierarchy[] }
        if (hierarchyData.results) {
          setIndustryHierarchy(hierarchyData.results)
        }
      } catch (error) {
        console.error('[select-companies] 業界候補取得に失敗しました:', error)
      }
    }
    fetchIndustries()
  }, [])

  const filteredHierarchyOptions = useMemo(() => {
    const normalizedQuery = industryQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return industryHierarchy
    }
    
    const filterHierarchy = (items: IndustryHierarchy[]): IndustryHierarchy[] => {
      return items
        .map((item) => {
          const matches = item.name.toLowerCase().includes(normalizedQuery)
          const filteredSub = item.sub_industries ? filterHierarchy(item.sub_industries) : []
          const hasMatchingSub = filteredSub.length > 0
          
          if (matches || hasMatchingSub) {
            return {
              ...item,
              sub_industries: filteredSub,
            }
          }
          return null
        })
        .filter((item): item is IndustryHierarchy => item !== null)
    }
    
    return filterHierarchy(industryHierarchy)
  }, [industryHierarchy, industryQuery])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleIndustrySelect = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    setFilters((prev) => ({ ...prev, industry: trimmed, page: 1 }))
    setIndustryQuery("")
    setIsIndustryFocused(false)
    // フォーカスを外す
    if (industryInputRef.current) {
      industryInputRef.current.blur()
    }
  }

  const showIndustryDropdown = (isIndustryFocused || Boolean(industryQuery.trim())) && filteredHierarchyOptions.length > 0
  const sortValue = filters.ordering === '-name' ? '-name' : 'name'
  const pageSizeValue = filters.page_size ?? 100
  const currentPage = filters.page ?? 1
  const rangeStart = companies.length === 0 ? 0 : (currentPage - 1) * pageSizeValue + 1
  const rangeEnd = companies.length === 0 ? 0 : rangeStart + companies.length - 1
  const formatErrorMessages = (messages: string[]) =>
    messages
      .filter((message) => typeof message === "string" && message.trim().length > 0)
      .map((message) => `・${message}`)
      .join("\n")

  const fetchCompanies = async () => {
    if (!clientId) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      const pageValue = filters.page ?? 1
      const pageSizeValue = filters.page_size ?? filters.limit ?? 100
      params.append('page', pageValue.toString())
      params.append('page_size', pageSizeValue.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (['page', 'page_size', 'limit', 'random_seed'].includes(key)) {
          return
        }

        if (value === undefined || value === null) return

        if (Array.isArray(value)) {
          value
            .filter((item) => item !== undefined && item !== null && String(item).trim().length > 0)
            .forEach((item) => params.append(key, String(item)))
          return
        }

        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed.length === 0 || trimmed === 'all') return
          params.append(key, trimmed)
          return
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
          params.append(key, value.toString())
          return
        }

        if (typeof value === 'boolean') {
          params.append(key, value.toString())
        }
      })

      const response = await apiClient.get(
        `/clients/${clientId}/available-companies?${params.toString()}`,
      )
      const data = await response.json()

      if (Array.isArray(data?.results)) {
        setCompanies(data.results as Company[])
        setTotalCount(typeof data?.count === 'number' ? data.count : data.results.length)
      } else if (Array.isArray(data)) {
        setCompanies(data as Company[])
        setTotalCount(data.length)
      } else {
        setCompanies([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error("企業データの取得に失敗しました:", error)
      toast({
        title: "エラー",
        description: "企業データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    if (!clientId) return

    try {
      const response = await apiClient.get(`/clients/${clientId}/projects`)
      const data = await response.json()
      setProjects(data?.results || [])
    } catch (error) {
      console.error("案件データの取得に失敗しました:", error)
    }
  }

  // 初回読み込み
  useEffect(() => {
    if (clientId) {
      fetchCompanies()
      fetchProjects()
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      fetchCompanies()
    }
  }, [clientId, JSON.stringify(filters)])

  const handleCompanySelect = (companyId: number, isSelected: boolean) => {
    const company = companies.find((c) => c.id === companyId)
    if (company?.ng_status?.is_ng) {
      toast({
        title: "選択できません",
        description: "この企業はNGリストに登録されています",
        variant: "destructive",
      })
      return
    }

    const newSelected = new Set(selectedCompanies)
    if (isSelected) {
      newSelected.add(companyId)
    } else {
      newSelected.delete(companyId)
    }
    setSelectedCompanies(newSelected)
  }

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      ordering: value,
      page: 1,
    }))
  }

  const handleAddToProject = async () => {
    if (selectedCompanies.size === 0) {
      toast({
        title: "エラー",
        description: "企業を選択してください",
        variant: "destructive",
      })
      return
    }

    if (!selectedProjectId) {
      toast({
        title: "エラー",
        description: "案件を選択してください",
        variant: "destructive",
      })
      return
    }

    setIsAddingToProject(true)
    try {
      const response = await apiClient.post(`/projects/${selectedProjectId}/add-companies/`, {
        company_ids: Array.from(selectedCompanies),
      })
      let data: any = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) || "企業追加に失敗しました"
        throw new Error(message)
      }

      const addedCount = typeof data?.added_count === "number" ? data.added_count : 0
      const errors = Array.isArray(data?.errors) ? data.errors.filter(Boolean) : []

      if (addedCount > 0) {
        toast({
          title: "成功",
          description: `${addedCount}社を案件に追加しました`,
        })
      }

      if (errors.length > 0) {
        toast({
          title: "一部の企業を追加できませんでした",
          description: formatErrorMessages(errors),
          variant: "destructive",
        })
      }

      if (addedCount > 0) {
        router.push(`/projects/${selectedProjectId}`)
      }
    } catch (error) {
      console.error("企業追加に失敗しました:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "企業追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsAddingToProject(false)
    }
  }

  const handleCreateNewProject = async () => {
    if (selectedCompanies.size === 0) {
      toast({
        title: "エラー",
        description: "企業を選択してください",
        variant: "destructive",
      })
      return
    }

    if (!newProjectName.trim()) {
      toast({
        title: "エラー",
        description: "案件名を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsAddingToProject(true)
    try {
      // 1. 新規案件を作成
      const projectResponse = await apiClient.post('/projects/', {
        name: newProjectName.trim(),
        client_id: clientId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0], // 今日の日付
      })

      if (!projectResponse.ok) {
        throw new Error("Failed to create project")
      }

      const projectData = await projectResponse.json()
      const newProjectId = projectData.id

      // 2. 新しい案件に企業を追加
      const addResponse = await apiClient.post(`/projects/${newProjectId}/add-companies/`, {
        company_ids: Array.from(selectedCompanies),
      })
      let addData: any = null
      try {
        addData = await addResponse.json()
      } catch {
        addData = null
      }

      if (!addResponse.ok) {
        const message =
          (addData && typeof addData.error === "string" && addData.error) ||
          "企業追加に失敗しました"
        throw new Error(message)
      }

      const addedCount = typeof addData?.added_count === "number" ? addData.added_count : 0
      const errors = Array.isArray(addData?.errors) ? addData.errors.filter(Boolean) : []

      toast({
        title: "成功",
        description: `新規案件「${newProjectName}」を作成し、${addedCount}社を追加しました`,
      })

      if (errors.length > 0) {
        toast({
          title: "一部の企業を追加できませんでした",
          description: formatErrorMessages(errors),
          variant: "destructive",
        })
      }

      router.push(`/projects/${newProjectId}`)
    } catch (error) {
      console.error("新規案件作成に失敗しました:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "新規案件作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsAddingToProject(false)
    }
  }

  if (clientLoading) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">営業対象企業を選択</h1>
              <p className="text-muted-foreground">{client?.name} 様の案件用企業選択</p>
            </div>
            </div>
            <div className="flex items-center space-x-2">
            <Badge variant="secondary">{selectedCompanies.size}社選択中</Badge>
            
            {/* 既存案件への追加 */}
            {!isCreatingNewProject && (
              <>
                <Select
                  value={selectedProjectId?.toString() || ""}
                  onValueChange={(value) => setSelectedProjectId(Number(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="既存案件を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={selectedCompanies.size === 0 || !selectedProjectId || isAddingToProject}
                  onClick={handleAddToProject}
                  variant="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isAddingToProject ? "追加中..." : "既存案件に追加"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingNewProject(true)}
                  disabled={selectedCompanies.size === 0}
                >
                  新規案件作成
                </Button>
              </>
            )}
            
            {/* 新規案件作成 */}
            {isCreatingNewProject && (
              <>
                <Input
                  placeholder="新規案件名を入力"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-64"
                />
                <Button
                  disabled={selectedCompanies.size === 0 || !newProjectName.trim() || isAddingToProject}
                  onClick={handleCreateNewProject}
                  variant="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isAddingToProject ? "作成中..." : "案件作成して追加"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingNewProject(false)
                    setNewProjectName("")
                  }}
                  disabled={isAddingToProject}
                >
                  キャンセル
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              検索・フィルタ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div>
                <Label>企業名検索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="企業名で検索"
                    className="pl-10"
                    value={filters.search || ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                  />
                </div>
              </div>
              <div>
                <Label>業界</Label>
                <div className="relative">
                  <Input
                    ref={industryInputRef}
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
                        if (industryInputRef.current) {
                          industryInputRef.current.blur()
                        }
                      }
                    }}
                  />
                  {showIndustryDropdown && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
                      <ul className="max-h-56 overflow-auto py-1 text-sm">
                        {filteredHierarchyOptions.map((category) => (
                          <li key={category.id}>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="flex-1 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground font-medium"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  handleIndustrySelect(category.name)
                                }}
                              >
                                {category.name}
                              </button>
                              {category.sub_industries && category.sub_industries.length > 0 && (
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    toggleCategory(category.id)
                                  }}
                                >
                                  {expandedCategories.has(category.id) ? '−' : '+'}
                                </button>
                              )}
                            </div>
                            {expandedCategories.has(category.id) && category.sub_industries && (
                              <ul className="pl-4">
                                {category.sub_industries.map((sub) => (
                                  <li key={sub.id}>
                                    <button
                                      type="button"
                                      className="w-full px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground text-xs"
                                      onMouseDown={(event) => {
                                        event.preventDefault()
                                        handleIndustrySelect(sub.name)
                                      }}
                                    >
                                      {sub.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {industryValue && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {industryValue}
                      <button
                        onClick={() => setFilters((prev) => ({ ...prev, industry: undefined, page: 1 }))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label>都道府県</Label>
                <Select
                  value={filters.prefecture || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, prefecture: value === "all" ? undefined : value, page: 1 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="東京都">東京都</SelectItem>
                    <SelectItem value="大阪府">大阪府</SelectItem>
                    <SelectItem value="愛知県">愛知県</SelectItem>
                    <SelectItem value="神奈川県">神奈川県</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>並び替え</Label>
                <Select value={sortValue} onValueChange={handleSortChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="並び替え" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">社名（昇順）</SelectItem>
                    <SelectItem value="-name">社名（降順）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="exclude-ng"
                  checked={Boolean(filters.exclude_ng)}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      exclude_ng: Boolean(checked),
                      page: 1,
                    }))
                  }
                />
                <Label htmlFor="exclude-ng" className="text-sm">
                  NG企業を除外
                </Label>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    page: 1,
                    page_size: 100,
                    exclude_ng: false,
                    ordering: 'name',
                  })
                }
              >
                クリア
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Table */}
        <Card>
          <CardHeader>
            <CardTitle>企業一覧</CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalCount > 0
                ? `${rangeStart.toLocaleString()} - ${rangeEnd.toLocaleString()} 件 / ${totalCount.toLocaleString()} 件`
                : '0 件'}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">選択</TableHead>
                    <TableHead className="max-w-[350px]">企業名</TableHead>
                    <TableHead data-testid="table-header-contact">担当者</TableHead>
                    <TableHead data-testid="table-header-facebook">Facebook</TableHead>
                    <TableHead data-testid="table-header-industry">業界</TableHead>
                    <TableHead>従業員数</TableHead>
                    <TableHead data-testid="table-header-revenue">売上</TableHead>
                    <TableHead>所在地</TableHead>
                    <TableHead data-testid="table-header-status">ステータス</TableHead>
                    <TableHead>NG状態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => {
                    const isNG = company.ng_status?.is_ng
                    const isSelected = selectedCompanies.has(company.id)

                    return (
                      <TableRow key={company.id} className={isNG ? "bg-red-50 opacity-60" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            disabled={isNG}
                            onCheckedChange={(checked) => handleCompanySelect(company.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="max-w-[350px]">
                          <div className="flex items-center space-x-2">
                            <span className={`truncate ${isNG ? "text-muted-foreground" : ""}`} title={company.name}>{company.name}</span>
                            {isNG && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">NG企業</p>
                                    {company.ng_status?.reasons?.global && (
                                      <p className="text-sm">グローバルNG: {company.ng_status.reasons.global}</p>
                                    )}
                                    {company.ng_status?.reasons?.client && (
                                      <p className="text-sm">
                                        クライアントNG: {company.ng_status.reasons.client.reason}
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-contact`}>
                          {company.contact_person_name ? (
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{company.contact_person_name}</p>
                              {company.contact_person_position && (
                                <p className="text-xs text-muted-foreground">{company.contact_person_position}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">未設定</span>
                          )}
                        </TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-facebook`}>
                          {company.facebook_url ? (
                            <a
                              href={company.facebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              data-testid={`company-${company.id}-facebook-link`}
                            >
                              Facebook
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">未設定</span>
                          )}
                        </TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-industry`}>{company.industry}</TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""}>
                          {formatEmployeeCount(company.employee_count)}
                        </TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-revenue`}>
                          {formatCurrency(company.revenue)}
                        </TableCell>
                        <TableCell className={`break-words ${isNG ? "text-muted-foreground" : ""}`}>
                          {company.prefecture || "-"}
                        </TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-status`}>
                          {getStatusBadge(company.status)}
                        </TableCell>
                        <TableCell>
                          {isNG ? <Badge variant="destructive">NG</Badge> : <Badge variant="secondary">選択可能</Badge>}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </TooltipProvider>
    </MainLayout>
  )
}
