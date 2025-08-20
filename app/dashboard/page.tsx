"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, FolderOpen, TrendingUp, Users } from "lucide-react"

export default function DashboardPage() {
  // Mock data - in real app, this would come from API
  const stats = {
    totalCompanies: 25000,
    activeProjects: 12,
    prospectCompanies: 1250,
    completedDeals: 45,
  }

  const recentProjects = [
    { id: 1, name: "Q1 新規開拓キャンペーン", status: "active", companies: 150 },
    { id: 2, name: "製造業向けソリューション", status: "active", companies: 89 },
    { id: 3, name: "IT企業向けプロモーション", status: "paused", companies: 67 },
  ]

  const recentCompanies = [
    { id: 1, name: "株式会社テクノロジー", industry: "IT・ソフトウェア", status: "prospect" },
    { id: 2, name: "製造株式会社", industry: "製造業", status: "active" },
    { id: 3, name: "商事株式会社", industry: "商社・卸売", status: "prospect" },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      prospect: "secondary",
      paused: "outline",
      completed: "outline",
    } as const

    const labels = {
      active: "アクティブ",
      prospect: "見込み",
      paused: "一時停止",
      completed: "完了",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">営業活動の概要と最新情報</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総企業数</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">データベース内の企業</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティブ案件</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">進行中のプロジェクト</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">見込み企業</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.prospectCompanies.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">営業対象企業</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成約件数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedDeals}</div>
              <p className="text-xs text-muted-foreground">今月の成約</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>最近の案件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.companies}社</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Companies */}
          <Card>
            <CardHeader>
              <CardTitle>最近の企業</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.industry}</p>
                    </div>
                    {getStatusBadge(company.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
