"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Company } from "@/lib/types"
import { ExternalLink, Building2 } from "lucide-react"

interface CompanyTableProps {
  companies: Company[]
  isLoading: boolean
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

export function CompanyTable({ companies, isLoading }: CompanyTableProps) {
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
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                          >
                            {company.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{formatEmployeeCount(company.employee_count)}</TableCell>
                    <TableCell>{formatCurrency(company.revenue)}</TableCell>
                    <TableCell>{company.location}</TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/companies/${company.id}`}>詳細</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
