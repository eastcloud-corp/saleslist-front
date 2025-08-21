"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Filter, Plus, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useClient } from "@/hooks/use-clients"
import type { Company, CompanyFilter } from "@/lib/types"
import { apiClient } from "@/lib/api-config"

export default function CompanySelectionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = Number.parseInt(params.id as string)

  const { client, isLoading: clientLoading } = useClient(clientId)

  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<CompanyFilter>({
    page: 1,
    page_size: 100,
    exclude_ng: true,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [isAddingToProject, setIsAddingToProject] = useState(false)

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get(`/clients/${clientId}/available-companies`, {
        params: filters,
      })

      if (response.data?.results) {
        setCompanies(response.data.results)
        setTotalCount(response.data.count || 0)
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
    try {
      const response = await apiClient.get(`/clients/${clientId}/projects`)
      setProjects(response.data?.results || [])
    } catch (error) {
      console.error("案件データの取得に失敗しました:", error)
    }
  }

  useEffect(() => {
    fetchCompanies()
    fetchProjects()
  }, [filters, clientId])

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
      await apiClient.post(`/projects/${selectedProjectId}/add-companies`, {
        company_ids: Array.from(selectedCompanies),
      })

      toast({
        title: "成功",
        description: `${selectedCompanies.size}社を案件に追加しました`,
      })

      router.push(`/projects/${selectedProjectId}`)
    } catch (error) {
      console.error("企業追加に失敗しました:", error)
      toast({
        title: "エラー",
        description: "企業追加に失敗しました",
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
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={(value) => setSelectedProjectId(Number(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="案件を選択" />
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
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAddingToProject ? "追加中..." : "案件に追加"}
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Select
                  value={filters.industry || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, industry: value === "all" ? undefined : value, page: 1 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="業界を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="IT・ソフトウェア">IT・ソフトウェア</SelectItem>
                    <SelectItem value="製造業">製造業</SelectItem>
                    <SelectItem value="商社・流通">商社・流通</SelectItem>
                    <SelectItem value="金融・保険">金融・保険</SelectItem>
                    <SelectItem value="建設・不動産">建設・不動産</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setFilters({ page: 1, page_size: 100, exclude_ng: true })}>
                  クリア
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Table */}
        <Card>
          <CardHeader>
            <CardTitle>企業一覧 ({totalCount.toLocaleString()}社)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">選択</TableHead>
                    <TableHead>企業名</TableHead>
                    <TableHead>業界</TableHead>
                    <TableHead>従業員数</TableHead>
                    <TableHead>都道府県</TableHead>
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
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={isNG ? "text-muted-foreground" : ""}>{company.name}</span>
                            {isNG && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">NG企業</p>
                                    {company.ng_status?.reasons.global && (
                                      <p className="text-sm">グローバルNG: {company.ng_status.reasons.global}</p>
                                    )}
                                    {company.ng_status?.reasons.client && (
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
                        <TableCell className={isNG ? "text-muted-foreground" : ""}>{company.industry}</TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""}>
                          {company.employee_count?.toLocaleString()}人
                        </TableCell>
                        <TableCell className={isNG ? "text-muted-foreground" : ""}>{company.prefecture}</TableCell>
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
  )
}
