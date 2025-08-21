"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { useClient, useClientStats, useClientProjects } from "@/hooks/use-clients"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"
import { ClientForm } from "@/components/clients/client-form"
import { NGListTab } from "@/components/clients/ng-list-tab"
import { ArrowLeft, Edit, BarChart3, FolderOpen, Building2, Shield } from "lucide-react"
import Link from "next/link"

export default function ClientDetailPage() {
  const params = useParams()
  const id = Number.parseInt(params.id as string)
  const [isEditing, setIsEditing] = useState(false)

  const { client, loading: clientLoading, error: clientError } = useClient(id)
  const { stats, loading: statsLoading } = useClientStats(id)
  const { projects, loading: projectsLoading } = useClientProjects(id)

  if (clientLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (clientError || !client) {
    return (
      <MainLayout>
        <ErrorAlert message={clientError || "クライアントが見つかりません"} />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                クライアント一覧へ
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">{client.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={client.is_active ? "default" : "secondary"}>
              {client.is_active ? "アクティブ" : "非アクティブ"}
            </Badge>
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "secondary" : "default"}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "編集終了" : "編集"}
            </Button>
          </div>
        </div>

        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>クライアント情報編集</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientForm client={client} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">
                <Building2 className="h-4 w-4 mr-2" />
                概要
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FolderOpen className="h-4 w-4 mr-2" />
                関連案件
              </TabsTrigger>
              <TabsTrigger value="ng-list">
                <Shield className="h-4 w-4 mr-2" />
                NGリスト
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                統計情報
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">担当者名</label>
                      <p className="text-gray-900">{client.contact_person}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">メールアドレス</label>
                      <p className="text-gray-900">{client.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">電話番号</label>
                      <p className="text-gray-900">{client.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">業界</label>
                      <p className="text-gray-900">{client.industry}</p>
                    </div>
                  </div>
                  {client.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">備考</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>関連案件</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <LoadingSpinner />
                  ) : projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{project.name}</h3>
                              <p className="text-sm text-gray-600">企業数: {project.company_count}社</p>
                            </div>
                            <Badge variant={project.status === "進行中" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">関連案件がありません</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ng-list">
              <NGListTab clientId={id} />
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsLoading ? (
                  <LoadingSpinner />
                ) : stats ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">総案件数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{stats.project_count}</p>
                        <p className="text-sm text-gray-600">進行中: {stats.active_project_count}件</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">総企業数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{stats.total_companies}</p>
                        <p className="text-sm text-gray-600">コンタクト済: {stats.total_contacted}社</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">成約率</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{stats.success_rate}%</p>
                        <p className="text-sm text-gray-600">完了案件: {stats.completed_project_count}件</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <p className="text-gray-500">統計情報を取得できませんでした</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  )
}
