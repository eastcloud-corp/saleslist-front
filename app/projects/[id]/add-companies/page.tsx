"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { useProject } from "@/hooks/use-projects"
import { useCompanies } from "@/hooks/use-companies"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Search, Plus, AlertTriangle, Building2, Loader2 } from "lucide-react"

interface AddCompaniesPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AddCompaniesPage({ params }: AddCompaniesPageProps) {
  const resolvedParams = await params
  return <AddCompaniesClient projectId={resolvedParams.id} />
}

function AddCompaniesClient({ projectId }: { projectId: string }) {
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()

  const { project, isLoading: projectLoading, addCompanies } = useProject(projectId)
  const {
    companies,
    isLoading: companiesLoading,
    pagination,
  } = useCompanies({
    search: searchTerm,
    industry: industryFilter === "all" ? undefined : industryFilter,
    limit: 50,
  })

  // Get existing company IDs to exclude them
  const existingCompanyIds = project?.companies?.map((pc) => pc.company.id.toString()) || []

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
        .filter((company) => !existingCompanyIds.includes(company.id.toString()))
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
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error("Failed to add companies:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const getCompanyNGStatus = (company: any) => {
    // Mock NG status - in real implementation, this would come from the API
    const isNG = Math.random() > 0.8 // 20% chance of being NG
    if (isNG) {
      return {
        is_ng: true,
        type: Math.random() > 0.5 ? "client" : "global",
        reason: Math.random() > 0.5 ? "競合他社のため" : "過去に取引トラブルあり",
      }
    }
    return { is_ng: false, type: null, reason: null }
  }

  const availableCompanies = companies.filter((company) => !existingCompanyIds.includes(company.id.toString()))

  const isLoading = projectLoading || companiesLoading

  if (projectLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>案件情報を読み込み中...</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>案件が見つかりません</AlertDescription>
        </Alert>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
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
              <CardTitle>利用可能な企業 ({availableCompanies.length}社)</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCompanyIds.length === availableCompanies.length && availableCompanies.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  すべて選択
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
            ) : availableCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">追加可能な企業が見つかりません</div>
            ) : (
              <div className="space-y-2">
                {availableCompanies.map((company) => {
                  const ngStatus = getCompanyNGStatus(company)
                  const isSelected = selectedCompanyIds.includes(company.id.toString())
                  const isDisabled = ngStatus.is_ng

                  return (
                    <TooltipProvider key={company.id}>
                      <div
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          isDisabled
                            ? "bg-red-50 border-red-200 opacity-60"
                            : isSelected
                              ? "bg-blue-50 border-blue-200"
                              : "hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCompanySelect(company.id.toString(), checked as boolean)}
                          disabled={isDisabled}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{company.name}</h3>
                            {ngStatus.is_ng && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    NG
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-medium">
                                      {ngStatus.type === "global" ? "グローバルNG" : "クライアントNG"}
                                    </p>
                                    <p>{ngStatus.reason}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{company.industry}</span>
                            <span>{company.prefecture}</span>
                            <span>従業員数: {company.employee_count}名</span>
                          </div>
                        </div>
                      </div>
                    </TooltipProvider>
                  )
                })}
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
    </MainLayout>
  )
}
