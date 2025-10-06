"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import type { Company } from "@/lib/types"
import { ExternalLink, Building2, Info, Plus } from 'lucide-react'
import type { CheckedState } from '@radix-ui/react-checkbox'

interface CompanyTableProps {
  companies: Company[]
  isLoading: boolean
  onRefresh?: () => void
  selectable?: boolean
  selectedIds?: number[]
  onSelectChange?: (companyId: number, selected: boolean) => void
  onSelectAllChange?: (selectAll: boolean) => void
  onAddToProject?: (company: Company) => void
  totalCount?: number
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

const getStatusBadge = (status: string) => {
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

  return (
    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
      {statusLabels[status as keyof typeof statusLabels] || status}
    </Badge>
  )
}

export function CompanyTable({
  companies,
  isLoading,
  onRefresh,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  onSelectAllChange,
  onAddToProject,
  totalCount,
}: CompanyTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            企業一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedSet = new Set(selectedIds)
  const companyIds = companies.map((company) => company.id)
  const isAllSelected = companyIds.length > 0 && companyIds.every((id) => selectedSet.has(id))
  const isPartiallySelected = companyIds.some((id) => selectedSet.has(id)) && !isAllSelected
  const headerChecked: CheckedState = isAllSelected ? true : isPartiallySelected ? 'indeterminate' : false

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          企業一覧
          {typeof totalCount === "number" && totalCount > 0 && (
            <Badge variant="outline" className="text-xs font-normal">
              全 {totalCount} 件
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-[48px]">
                    <Checkbox
                      aria-label="すべての企業を選択"
                      checked={headerChecked}
                      onCheckedChange={(checked) => onSelectAllChange?.(checked === true)}
                    />
                  </TableHead>
                )}
                <TableHead>企業名</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>Facebook</TableHead>
                <TableHead>業界</TableHead>
                <TableHead>従業員数</TableHead>
                <TableHead>売上</TableHead>
                <TableHead>所在地</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="w-[160px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={selectable ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    企業が見つかりません。検索条件を調整してください。
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => {
                  const ngStatus = company.ng_status
                  const hasClientNG = ngStatus?.types?.includes("client")
                  const hasProjectNG = ngStatus?.types?.includes("project")
                  const hasGlobalNG = company.is_global_ng
                  const hasAnyNG = hasClientNG || hasProjectNG || hasGlobalNG

                  return (
                    <TableRow
                      key={company.id}
                      className={selectedSet.has(company.id) ? "bg-muted/30" : undefined}
                    >
                      {selectable && (
                        <TableCell className="w-[48px]">
                          <Checkbox
                            aria-label={`企業を選択: ${company.name}`}
                            checked={selectedSet.has(company.id)}
                            onCheckedChange={(checked) => onSelectChange?.(company.id, checked === true)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.website_url && (
                              <a
                                href={company.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                              >
                                {company.website_url.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {hasAnyNG && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1">
                                    <Info className="h-4 w-4 text-amber-600" />
                                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                      {hasGlobalNG && hasClientNG ? "複数NG" : 
                                       hasGlobalNG ? "グローバルNG" :
                                       hasClientNG ? "クライアントNG" : 
                                       hasProjectNG ? "案件NG" : "NG"}
                                    </Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-sm">NGリスト情報</p>
                                    {hasGlobalNG && (
                                      <div className="p-2 bg-red-50 rounded border-l-2 border-red-200">
                                        <p className="text-sm font-medium text-red-800">グローバルNG</p>
                                        <p className="text-xs text-red-600">全案件で営業対象外</p>
                                      </div>
                                    )}
                                    {hasClientNG && ngStatus?.reasons?.client && (
                                      <div className="p-2 bg-amber-50 rounded border-l-2 border-amber-200">
                                        <p className="text-sm font-medium text-amber-800">
                                          クライアントNG: {ngStatus.reasons.client.name}
                                        </p>
                                        <p className="text-xs text-amber-600">
                                          理由: {ngStatus.reasons.client.reason}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          ※他のクライアントの案件には追加可能
                                        </p>
                                      </div>
                                    )}
                                    {hasProjectNG && ngStatus?.reasons?.project && (
                                      <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                                        <p className="text-sm font-medium text-blue-800">
                                          案件NG: {ngStatus.reasons.project.name}
                                        </p>
                                        <p className="text-xs text-blue-600">
                                          理由: {ngStatus.reasons.project.reason}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">※他の案件には追加可能</p>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        {company.facebook_url ? (
                          <a
                            href={company.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Facebook
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">未設定</span>
                        )}
                      </TableCell>
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>{formatEmployeeCount(company.employee_count)}</TableCell>
                      <TableCell>{formatCurrency(company.revenue)}</TableCell>
                      <TableCell>{company.prefecture}</TableCell>
                      <TableCell>{getStatusBadge(company.status || "active")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/companies/${company.id}`}>詳細</Link>
                          </Button>
                          {onAddToProject && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => onAddToProject(company)}
                              disabled={hasAnyNG}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              案件追加
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
