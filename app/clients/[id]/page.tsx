"use client"

import { useState, use } from "react"
import { useClient, useClientStats, useClientProjects, useClients } from "@/hooks/use-clients"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"
import { ClientForm } from "@/components/clients/client-form"
import { NGListTab } from "@/components/clients/ng-list-tab"
import { ArrowLeft, Edit, BarChart3, FolderOpen, Building2, Shield, Users } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ClientDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const resolvedParams = use(params)
  const id = Number.parseInt(resolvedParams.id)
  const [isEditing, setIsEditing] = useState(false)

  const { client, loading: clientLoading, error: clientError } = useClient(id)
  const { stats, loading: statsLoading } = useClientStats(id)
  const { projects, loading: projectsLoading } = useClientProjects(id)
  const { updateClient } = useClients()

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
            <Link href={`/clients/${id}/select-companies`}>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                営業対象企業を選択
              </Button>
            </Link>
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "secondary" : "default"}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "編集終了" : "編集"}
            </Button>
          </div>
        </div>

        {isEditing ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>クライアント情報編集</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  キャンセル
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClientForm 
                client={client} 
                onSubmit={async (data) => {
                  await updateClient(id, data)
                  setIsEditing(false)
                }} 
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="basic-info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic-info">
                <Building2 className="h-4 w-4 mr-2" />
                基本情報
              </TabsTrigger>
              <TabsTrigger value="ng-list">
                <Shield className="h-4 w-4 mr-2" />
                NGリスト
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FolderOpen className="h-4 w-4 mr-2" />
                案件一覧
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                統計情報
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">担当者名</Label>
                      <p className="text-gray-900">{client.contact_person || "未設定"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">メールアドレス</Label>
                      <p className="text-gray-900">{client.email || "未設定"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">電話番号</Label>
                      <p className="text-gray-900">{client.phone || "未設定"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">業界</Label>
                      <p className="text-gray-900">{client.industry || "未設定"}</p>
                    </div>
                  </div>
                  {client.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">備考</Label>
                      <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <Link href={`/clients/${id}/select-companies`}>
                      <Button className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        営業対象企業を選択して案件を作成
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ng-list">
              <NGListTab clientId={id} />
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>案件一覧</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <FolderOpen className="h-4 w-4 mr-2" />
                          新規案件作成
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>新規案件作成</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="project-name">案件名</Label>
                            <Input id="project-name" placeholder="案件名を入力" />
                          </div>
                          <div>
                            <Label htmlFor="project-description">概要</Label>
                            <Textarea id="project-description" placeholder="案件の概要を入力" />
                          </div>
                          <div>
                            <Label htmlFor="assigned-user">担当者</Label>
                            <Input id="assigned-user" placeholder="担当者名を入力" />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline">キャンセル</Button>
                            <Button>作成</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <LoadingSpinner />
                  ) : projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Link href={`/projects/${project.id}`} className="block">
                                <h3 className="font-medium text-blue-600 hover:text-blue-800">{project.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  企業数: {project.company_count || 0}社 | 作成日:{" "}
                                  {new Date(project.created_at).toLocaleDateString()}
                                </p>
                                {project.description && (
                                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                                )}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
                                {project.status === "in_progress"
                                  ? "進行中"
                                  : project.status === "completed"
                                    ? "完了"
                                    : project.status === "planning"
                                      ? "計画中"
                                      : "中止"}
                              </Badge>
                              <Link href={`/clients/${id}/select-companies?project=${project.id}`}>
                                <Button size="sm" variant="outline">
                                  <Users className="h-4 w-4 mr-2" />
                                  企業追加
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">関連案件がありません</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            最初の案件を作成
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>新規案件作成</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="project-name">案件名</Label>
                              <Input id="project-name" placeholder="案件名を入力" />
                            </div>
                            <div>
                              <Label htmlFor="project-description">概要</Label>
                              <Textarea id="project-description" placeholder="案件の概要を入力" />
                            </div>
                            <div>
                              <Label htmlFor="assigned-user">担当者</Label>
                              <Input id="assigned-user" placeholder="担当者名を入力" />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">キャンセル</Button>
                              <Button>作成</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                        <p className="text-2xl font-bold">{stats.project_count || 0}</p>
                        <p className="text-sm text-gray-600">進行中: {stats.active_project_count || 0}件</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">総企業数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{stats.total_companies || 0}</p>
                        <p className="text-sm text-gray-600">コンタクト済: {stats.total_contacted || 0}社</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">成約率</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{stats.success_rate || 0}%</p>
                        <p className="text-sm text-gray-600">完了案件: {stats.completed_project_count || 0}件</p>
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
