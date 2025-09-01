"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Company } from "@/lib/types"
import { ExternalLink, Building2, Info } from 'lucide-react'

interface CompanyTableProps {
  companies: Company[]
  isLoading: boolean
  onRefresh?: () => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatEmployeeCount = (count: number) => {
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

export function CompanyTable({ companies, isLoading, onRefresh }: CompanyTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          企業 ({companies.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>企業名</TableHead>
                <TableHead>業界</TableHead>
                <TableHead>従業員数</TableHead>
                <TableHead>売上</TableHead>
                <TableHead>所在地</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableRow key={company.id}>
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
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>{formatEmployeeCount(company.employee_count)}</TableCell>
                      <TableCell>{formatCurrency(company.revenue)}</TableCell>
                      <TableCell>{company.prefecture}</TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/companies/${company.id}`}>詳細</Link>
                        </Button>
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
