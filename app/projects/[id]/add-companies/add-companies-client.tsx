"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useProject } from "@/hooks/use-projects"
import { useCompanies } from "@/hooks/use-companies"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Search, Plus, AlertTriangle, Building2, Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface AddCompaniesClientProps {
  projectId: string
}

export function AddCompaniesClient({ projectId }: AddCompaniesClientProps) {
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { project, isLoading: projectLoading, addCompanies, availableCompanies, isLoadingAvailableCompanies } = useProject(projectId)
  
  // フィルタリング処理をフロントエンドで実行
  const filteredCompanies = (availableCompanies || []).filter(company => {
    const matchesSearch = !searchTerm || company.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = industryFilter === "all" || company.industry === industryFilter
    return matchesSearch && matchesIndustry
  })

  const companies = filteredCompanies
  const companiesLoading = isLoadingAvailableCompanies

  const handleCompanySelect = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanyIds((prev) => [...prev, companyId])
    } else {
      setSelectedCompanyIds((prev) => prev.filter((id) => id !== companyId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableCompanyIds = companies
        .filter((company) => !getCompanyNGStatus(company).is_ng)
        .map((company) => company.id.toString())
      setSelectedCompanyIds(availableCompanyIds)
    } else {
      setSelectedCompanyIds([])
    }
  }

  const handleAddCompanies = async () => {
    if (selectedCompanyIds.length === 0) return

    setIsAdding(true)
    try {
      const companyIds = selectedCompanyIds.map((id) => Number.parseInt(id))
      await addCompanies(companyIds)
      
      toast({
        title: "成功",
        description: `${selectedCompanyIds.length}社を案件に追加しました`,
      })
      
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error("Failed to add companies:", error)
      toast({
        title: "エラー", 
        description: "企業の追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const getCompanyNGStatus = (company: any) => {
    return company.ng_status || { is_ng: false, types: [], reasons: {} }
  }

  const isLoading = projectLoading || isLoadingAvailableCompanies

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>案件情報を読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <Alert variant="destructive">
        <AlertDescription>案件が見つかりません</AlertDescription>
      </Alert>
    )
  }

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              案件詳細に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              企業を追加
            </h1>
            <p className="text-muted-foreground">{project.name} に企業を追加します</p>
          </div>
        </div>
        <Button onClick={handleAddCompanies} disabled={selectedCompanyIds.length === 0 || isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? "追加中..." : `選択した企業を追加 (${selectedCompanyIds.length})`}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>企業検索・フィルタ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="企業名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="業界を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての業界</SelectItem>
                <SelectItem value="IT・ソフトウェア">IT・ソフトウェア</SelectItem>
                <SelectItem value="製造業">製造業</SelectItem>
                <SelectItem value="小売業">小売業</SelectItem>
                <SelectItem value="金融業">金融業</SelectItem>
                <SelectItem value="建設業">建設業</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Company List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>利用可能な企業 ({filteredCompanies.length}社)</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedCompanyIds.length === filteredCompanies.filter(c => !getCompanyNGStatus(c).is_ng).length && 
                  filteredCompanies.filter(c => !getCompanyNGStatus(c).is_ng).length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                すべて選択（NG企業除く）
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>企業データを読み込み中...</span>
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">追加可能な企業が見つかりません</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">選択</TableHead>
                    <TableHead>企業名</TableHead>
                    <TableHead data-testid="table-header-contact">担当者</TableHead>
                    <TableHead data-testid="table-header-facebook">Facebook</TableHead>
                    <TableHead data-testid="table-header-industry">業界</TableHead>
                    <TableHead>従業員数</TableHead>
                    <TableHead data-testid="table-header-revenue">売上</TableHead>
                    <TableHead>所在地</TableHead>
                    <TableHead data-testid="table-header-status">ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const ngStatus = getCompanyNGStatus(company)
                    const isSelected = selectedCompanyIds.includes(company.id.toString())
                    const isDisabled = ngStatus.is_ng

                    return (
                      <TooltipProvider key={company.id}>
                        <TableRow
                          className={
                            isDisabled
                              ? "bg-red-50 opacity-60"
                              : isSelected
                                ? "bg-blue-50"
                                : ""
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleCompanySelect(company.id.toString(), checked as boolean)}
                              disabled={isDisabled}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={isDisabled ? "text-muted-foreground" : "font-medium"}>{company.name}</span>
                              {ngStatus.is_ng && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      NG
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm space-y-1">
                                      {ngStatus.types?.includes("global") && (
                                        <div>
                                          <p className="font-medium text-red-600">グローバルNG</p>
                                          <p>{ngStatus.reasons?.global}</p>
                                        </div>
                                      )}
                                      {ngStatus.types?.includes("client") && (
                                        <div>
                                          <p className="font-medium text-orange-600">クライアントNG</p>
                                          <p>理由: {ngStatus.reasons?.client?.reason}</p>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-contact`}>
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
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-facebook`}>
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
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-industry`}>
                            {company.industry}
                          </TableCell>
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""}>
                            {formatEmployeeCount(company.employee_count)}
                          </TableCell>
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-revenue`}>
                            {formatCurrency(company.revenue)}
                          </TableCell>
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""}>
                            {company.prefecture || "-"}
                          </TableCell>
                          <TableCell className={isDisabled ? "text-muted-foreground" : ""} data-testid={`company-${company.id}-status`}>
                            {getStatusBadge(company.status)}
                          </TableCell>
                        </TableRow>
                      </TooltipProvider>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {selectedCompanyIds.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{selectedCompanyIds.length}社を選択中</div>
              <Button onClick={handleAddCompanies} disabled={isAdding}>
                <Plus className="h-4 w-4 mr-2" />
                {isAdding ? "追加中..." : "案件に追加"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </TooltipProvider>
    </MainLayout>
  )
}
