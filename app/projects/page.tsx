"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { ProjectForm } from "@/components/projects/project-form"
import { useProjects } from "@/hooks/use-projects"
import { useClients } from "@/hooks/use-clients"
import { apiClient } from "@/lib/api-config"
import type { Project } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FolderOpen, Edit3, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProjectsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Record<number, Partial<Project>>>({})
  const [progressStatuses, setProgressStatuses] = useState<Array<{id: number, name: string}>>([])
  const [serviceTypes, setServiceTypes] = useState<Array<{id: number, name: string}>>([])
  const [meetingStatuses, setMeetingStatuses] = useState<Array<{id: number, name: string}>>([])
  const [mediaTypes, setMediaTypes] = useState<Array<{id: number, name: string}>>([])
  const [listImportSources, setListImportSources] = useState<Array<{id: number, name: string}>>([])
  const [listAvailabilities, setListAvailabilities] = useState<Array<{id: number, name: string}>>([])
  const [projectFilters, setProjectFilters] = useState({
    search: '',
    client: 'all',
    progress_status: 'all',
    service_type: 'all',
  })

  const activeFilters = useMemo(() => {
    const params: Record<string, string> = {}
    if (projectFilters.search.trim()) {
      params.search = projectFilters.search.trim()
    }
    if (projectFilters.client !== 'all') {
      params.client = projectFilters.client
    }
    if (projectFilters.progress_status !== 'all') {
      params.progress_status = projectFilters.progress_status
    }
    if (projectFilters.service_type !== 'all') {
      params.service_type = projectFilters.service_type
    }
    return params
  }, [projectFilters])

  const filterHash = useMemo(() => {
    const entries = Object.entries(activeFilters)
    if (!entries.length) return 'default'
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
  }, [activeFilters])

  const hasActiveFilters = useMemo(() => Object.keys(activeFilters).length > 0, [activeFilters])

  const { projects, isLoading, error, createProject, refetch, pagination } = useProjects({
    filters: activeFilters,
  })
  const { clients, loading: clientsLoading } = useClients({ limit: 200, filters: { is_active: true } })
  const { toast } = useToast()
  const [isAcquiringLock, setIsAcquiringLock] = useState(false)
  const [isPageLocked, setIsPageLocked] = useState(false)
  const lockParamsRef = useRef({ page: 1, page_size: 20, filter_hash: "default" })
  const filtersDisabled = editMode
  const totalProjects = pagination?.total ?? projects.length

  // マスターデータ取得
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [
          progressData, 
          serviceData, 
          meetingData, 
          mediaData, 
          listImportData, 
          listAvailabilityData
        ] = await Promise.all([
          apiClient.get('/master/progress-statuses/'),
          apiClient.get('/master/service-types/'),  
          apiClient.get('/master/meeting-statuses/'),
          apiClient.get('/master/media-types/'),
          apiClient.get('/master/list-import-sources/'),
          apiClient.get('/master/list-availabilities/')
        ])
        
        const progressJson = await progressData.json()
        const serviceJson = await serviceData.json()
        const meetingJson = await meetingData.json()
        const mediaJson = await mediaData.json()
        const listImportJson = await listImportData.json()
        const listAvailabilityJson = await listAvailabilityData.json()
        
        setProgressStatuses(progressJson.results || [])
        setServiceTypes(serviceJson.results || [])
        setMeetingStatuses(meetingJson.results || [])
        setMediaTypes(mediaJson.results || [])
        setListImportSources(listImportJson.results || [])
        setListAvailabilities(listAvailabilityJson.results || [])
        
        console.log('マスターデータ取得完了:', {
          進行状況: progressJson.results?.length || 0,
          サービス: serviceJson.results?.length || 0,
          定例会: meetingJson.results?.length || 0,
          媒体: mediaJson.results?.length || 0,
          リスト輸入先: listImportJson.results?.length || 0,
          リスト有無: listAvailabilityJson.results?.length || 0
        })
      } catch (error) {
        console.error('マスターデータ取得エラー:', error)
      }
    }
    fetchMasterData()
  }, [])
  const getClientName = (project: any) => {
    return project.client_name || project.client_company || "クライアント未設定"
  }

  const handleFilterReset = () => {
    setProjectFilters({
      search: '',
      client: 'all',
      progress_status: 'all',
      service_type: 'all',
    })
  }

  const handleSaveAll = async (): Promise<boolean> => {
    console.log('保存処理開始, editData:', editData)

    const changedProjectIds = Object.keys(editData)
      .filter((projectId) => {
        const changes = editData[Number(projectId)]
        return changes && Object.keys(changes).length > 0
      })
      .map((id) => Number(id))

    console.log('変更対象案件:', changedProjectIds)

    if (changedProjectIds.length === 0) {
      toast({
        title: '変更はありません',
        description: '更新対象の入力はありませんでした。',
      })
      return true
    }

    try {
      for (const projectId of changedProjectIds) {
        const changes = editData[projectId]
        console.log(`プロジェクト${projectId}の変更内容:`, changes)

        const response = await apiClient.patch(`/projects/${projectId}/?management_mode=true`, changes)

        if (!response.ok) {
          let detail = ''
          try {
            const errorBody = await response.json()
            detail = errorBody?.error || errorBody?.message || ''
          } catch (jsonError) {
            detail = await response.text()
          }
          throw new Error(`プロジェクト${projectId}の更新に失敗しました (${response.status}) ${detail}`)
        }
      }

      await refetch()
      setEditData({})
      toast({
        title: '保存しました',
        description: `${changedProjectIds.length}件の案件を更新しました。`,
      })
      return true
    } catch (error) {
      console.error('保存エラー:', error)
      toast({
        title: '保存に失敗しました',
        description:
          error instanceof Error ? error.message : '保存処理でエラーが発生しました。再度お試しください。',
        variant: 'destructive',
      })
      return false
    }
  }

  const releasePageLock = useCallback(async () => {
    if (!isPageLocked) return

    const params = lockParamsRef.current
    const query = new URLSearchParams({
      page: String(params.page),
      page_size: String(params.page_size),
      filter_hash: params.filter_hash,
    })

    try {
      const response = await apiClient.delete(`/projects/page-unlock/?${query.toString()}`)
      if (!response.ok) {
        const text = await response.text()
        console.warn('ページロック解除応答:', text)
      }
    } catch (error) {
      console.error('ページロック解除エラー:', error)
    } finally {
      setIsPageLocked(false)
    }
  }, [isPageLocked])

  useEffect(() => {
    return () => {
      if (isPageLocked) {
        releasePageLock().catch((error) => console.error('クリーンアップ時のロック解除エラー:', error))
      }
    }
  }, [isPageLocked, releasePageLock])

  const handleEditModeToggle = async () => {
    console.log('編集モード切り替え, 現在:', editMode)

    if (!editMode) {
      setIsAcquiringLock(true)
      const params = {
        page: pagination?.page || 1,
        page_size: pagination?.limit || Math.max(projects.length, 20),
        filter_hash: filterHash,
      }

      try {
        const response = await apiClient.post('/projects/page-lock/', params)

        if (!response.ok) {
          let detail = ''
          try {
            const body = await response.json()
            detail = body?.error || body?.message || ''
          } catch (jsonError) {
            detail = await response.text()
          }

          toast({
            title: '編集モードを開始できません',
            description: detail || '他のユーザーが編集中の可能性があります。',
            variant: 'destructive',
          })
          return
        }

        lockParamsRef.current = params
        setIsPageLocked(true)
        setEditMode(true)
        toast({
          title: '編集モードを開始しました',
          description: '入力後に「編集終了」で保存してください。',
        })
        console.log('編集モードON')
      } catch (error) {
        console.error('ページロック取得エラー:', error)
        toast({
          title: '編集モードを開始できません',
          description: error instanceof Error ? error.message : 'ロック取得中にエラーが発生しました。',
          variant: 'destructive',
        })
      } finally {
        setIsAcquiringLock(false)
      }
    } else {
      const saved = await handleSaveAll()
      if (saved) {
        await releasePageLock()
        setEditMode(false)
        toast({
          title: '編集モードを終了しました',
          description: '最新のデータに更新しました。',
        })
        console.log('編集モードOFF')
      }
    }
  }

  const handleCreateProject = async (data: any) => {
    try {
      await createProject({
        ...data,
        created_by: "current-user", // This would come from auth context
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Failed to create project:", error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "未設定"
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">未設定</Badge>
    
    const variants = {
      active: "default",
      paused: "secondary",
      completed: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">案件管理</h1>
              <p className="text-muted-foreground">営業キャンペーンを管理し、進捗を追跡</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">案件管理</h1>
            <p className="text-muted-foreground">営業キャンペーンを管理し、進捗を追跡</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={handleEditModeToggle}
              disabled={isAcquiringLock}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isAcquiringLock ? 'ロック取得中...' : editMode ? '編集完了' : '編集モード'}
              {!isAcquiringLock && (
                <span className="ml-1 text-xs">({editMode ? 'OFF' : 'ON'})</span>
              )}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規案件
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>新規案件作成</DialogTitle>
                </DialogHeader>
                <ProjectForm onSave={handleCreateProject} onCancel={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="project-search">キーワード</Label>
                <div className="relative">
                  <Input
                    id="project-search"
                    placeholder="案件名・クライアント名で検索"
                    value={projectFilters.search}
                    onChange={(event) =>
                      setProjectFilters((prev) => ({ ...prev, search: event.target.value }))
                    }
                    disabled={filtersDisabled}
                    className="pl-8"
                    autoComplete="off"
                  />
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-client-filter">クライアント</Label>
                <Select
                  value={projectFilters.client}
                  onValueChange={(value) =>
                    setProjectFilters((prev) => ({ ...prev, client: value }))
                  }
                  disabled={filtersDisabled}
                >
                  <SelectTrigger id="project-client-filter">
                    <SelectValue placeholder={clientsLoading ? "読み込み中..." : "すべて"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {clientsLoading ? (
                      <SelectItem value="loading" disabled>
                        読み込み中...
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-progress-filter">進行状況</Label>
                <Select
                  value={projectFilters.progress_status}
                  onValueChange={(value) =>
                    setProjectFilters((prev) => ({ ...prev, progress_status: value }))
                  }
                  disabled={filtersDisabled}
                >
                  <SelectTrigger id="project-progress-filter">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {progressStatuses.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        選択肢を取得できませんでした
                      </SelectItem>
                    ) : (
                      progressStatuses.map((status) => (
                        <SelectItem key={status.id} value={String(status.id)}>
                          {status.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-service-filter">サービス種別</Label>
                <Select
                  value={projectFilters.service_type}
                  onValueChange={(value) =>
                    setProjectFilters((prev) => ({ ...prev, service_type: value }))
                  }
                  disabled={filtersDisabled}
                >
                  <SelectTrigger id="project-service-filter">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {serviceTypes.length === 0 ? (
                      <SelectItem value="no-service" disabled>
                        選択肢を取得できませんでした
                      </SelectItem>
                    ) : (
                      serviceTypes.map((service) => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          {service.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? '案件を読み込み中...'
                  : `表示件数: ${projects.length}件 / 総件数: ${totalProjects}件`}
              </p>
              <div className="flex items-center gap-2">
                {editMode && (
                  <span className="text-xs text-muted-foreground">
                    編集モード中はフィルターを変更できません
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFilterReset}
                  disabled={!hasActiveFilters || filtersDisabled}
                >
                  フィルターをクリア
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">案件がありません</h3>
              <p className="text-muted-foreground mb-4">最初の案件を作成して営業キャンペーンの管理を始めましょう。</p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    案件作成
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新規案件作成</DialogTitle>
                  </DialogHeader>
                  <ProjectForm onSave={handleCreateProject} onCancel={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-md">
            <div className="flex">
              {/* 固定列: 案件名・クライアント名 */}
              <div className="flex-none border-r bg-background">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground min-w-[120px] w-[120px]">
                        案件名
                      </th>
                      <th className="h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground min-w-[120px] w-[120px]">
                        クライアント
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        data-project-id={project.id}
                        className={editMode ? "border-b hover:bg-gray-50 h-20" : "border-b hover:bg-gray-50 h-16"}
                      >
                        <td className="p-3 align-middle min-w-[120px] w-[120px] max-w-[120px] h-16">
                          <Link href={`/projects/${project.id}`} className="block hover:text-blue-600">
                            <div 
                              className="text-xs font-medium leading-3 overflow-hidden cursor-pointer"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-all'
                              }}
                            >
                              {project.name}
                            </div>
                          </Link>
                        </td>
                        <td className="p-3 align-middle min-w-[120px] w-[120px] max-w-[120px] h-16">
                          <div 
                            className="text-xs leading-3 overflow-hidden"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-all'
                            }}
                          >
                            {getClientName(project)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 横スクロール可能な編集エリア */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[180px]">進行状況</th>
                      <th className="h-10 px-1 text-center align-middle text-xs font-medium text-muted-foreground min-w-[50px] w-[50px]">アポ数</th>
                      <th className="h-10 px-1 text-center align-middle text-xs font-medium text-muted-foreground min-w-[50px] w-[50px]">承認数</th>
                      <th className="h-10 px-1 text-center align-middle text-xs font-medium text-muted-foreground min-w-[50px] w-[50px]">返信数</th>
                      <th className="h-10 px-1 text-center align-middle text-xs font-medium text-muted-foreground min-w-[50px] w-[50px]">友達数</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[80px]">Dログイン可</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[80px]">運用者招待</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[150px]">状況</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[80px]">定例会実施日</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[100px]">リスト輸入先</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[80px]">記載日</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[150px]">進行タスク</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[150px]">デイリータスク</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[150px]">返信チェック</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[150px]">備考</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[150px]">クレームor要望</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[80px]">ディレクター</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[80px]">運用者</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[80px]">営業マン</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[80px]">運用開始日</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[80px]">終了予定日</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[100px]">サービス</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[80px]">媒体</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[100px]">定例会ステータス</th>
                      <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground min-w-[80px]">リスト有無</th>
                      <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[60px]">リスト数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        data-project-id={project.id}
                        className={editMode ? "border-b hover:bg-gray-50 h-20" : "border-b hover:bg-gray-50 h-16"}
                      >
                        <td className="p-2 align-middle h-16 text-xs min-w-[120px]">
                          {editMode ? (
                            <div className="text-red-500 text-xs">編集モード</div>
                          ) : (
                            <div className="text-gray-500 text-xs">表示モード</div>
                          )}
                          {editMode ? (
                            <Select
                              value={editData[Number(project.id)]?.progress_status_id?.toString() || project.progress_status || ''}
                              onValueChange={(value) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], progress_status_id: parseInt(value) }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={project.progress_status || "進行状況を選択"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="debug" className="text-red-500 text-xs">
                                  DEBUG: {progressStatuses.length}件
                                </SelectItem>
                                {progressStatuses.map((status) => (
                                  <SelectItem key={status.id} value={status.id.toString()} className="text-xs">
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            project.progress_status || '-'
                          )}
                        </td>
                        <td className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px] h-16">
                          {editMode ? (
                            <Input
                              type="number"
                              value={editData[Number(project.id)]?.appointment_count ?? project.appointment_count}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], appointment_count: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-12 h-8 text-xs text-center p-1"
                            />
                          ) : (
                            project.appointment_count || 0
                          )}
                        </td>
                        <td className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px] h-16">
                          {editMode ? (
                            <Input
                              type="number"
                              value={editData[Number(project.id)]?.approval_count ?? project.approval_count}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], approval_count: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-12 h-8 text-xs text-center p-1"
                            />
                          ) : (
                            project.approval_count || 0
                          )}
                        </td>
                        <td className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px] h-16">
                          {editMode ? (
                            <Input
                              type="number"
                              value={editData[Number(project.id)]?.reply_count ?? project.reply_count}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], reply_count: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-12 h-8 text-xs text-center p-1"
                            />
                          ) : (
                            project.reply_count || 0
                          )}
                        </td>
                        <td className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px] h-16">
                          {editMode ? (
                            <Input
                              type="number"
                              value={editData[Number(project.id)]?.friends_count ?? project.friends_count}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], friends_count: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-12 h-8 text-xs text-center p-1"
                            />
                          ) : (
                            project.friends_count || 0
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[80px]">
                          {editMode ? (
                            <Checkbox
                              checked={editData[Number(project.id)]?.director_login_available ?? project.director_login_available}
                              onCheckedChange={(checked) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { 
                                  ...prev[Number(project.id)], 
                                  director_login_available: checked === true
                                }
                              }))}
                            />
                          ) : (
                            project.director_login_available ? '✓' : ''
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[80px]">
                          {editMode ? (
                            <Checkbox
                              checked={editData[Number(project.id)]?.operator_group_invited ?? project.operator_group_invited}
                              onCheckedChange={(checked) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { 
                                  ...prev[Number(project.id)], 
                                  operator_group_invited: checked === true
                                }
                              }))}
                            />
                          ) : (
                            project.operator_group_invited ? '✓' : ''
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[150px]">
                          {editMode ? (
                            <Textarea
                              value={editData[Number(project.id)]?.situation ?? (project.situation || '')}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], situation: e.target.value }
                              }))}
                              className="w-full h-12 text-xs p-1 resize-none"
                              rows={2}
                            />
                          ) : (
                            project.situation || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              type="date"
                              value={editData[Number(project.id)]?.regular_meeting_date || project.regular_meeting_date || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], regular_meeting_date: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            formatDate(project.regular_meeting_date || "")
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[100px]">
                          {editMode ? (
                            <Select
                              value={editData[Number(project.id)]?.list_import_source_id?.toString() || project.list_import_source_id?.toString() || ''}
                              onValueChange={(value) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], list_import_source_id: parseInt(value) }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="リスト輸入先を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {listImportSources.map((source) => (
                                  <SelectItem key={source.id} value={source.id.toString()} className="text-xs">
                                    {source.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            project.list_import_source || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              type="date"
                              value={editData[Number(project.id)]?.entry_date_sales || project.entry_date_sales || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], entry_date_sales: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            formatDate(project.entry_date_sales || "")
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[150px]">
                          {editMode ? (
                            <Textarea
                              value={editData[Number(project.id)]?.progress_tasks || project.progress_tasks || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], progress_tasks: e.target.value }
                              }))}
                              className="w-full h-12 text-xs p-1 resize-none"
                              rows={2}
                            />
                          ) : (
                            project.progress_tasks || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[150px]">
                          {editMode ? (
                            <Textarea
                              value={editData[Number(project.id)]?.daily_tasks || project.daily_tasks || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], daily_tasks: e.target.value }
                              }))}
                              className="w-full h-12 text-xs p-1 resize-none"
                              rows={2}
                            />
                          ) : (
                            project.daily_tasks || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[150px]">
                          {editMode ? (
                            <Textarea
                              value={editData[Number(project.id)]?.reply_check_notes || project.reply_check_notes || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], reply_check_notes: e.target.value }
                              }))}
                              className="w-full h-12 text-xs p-1 resize-none"
                              rows={2}
                            />
                          ) : (
                            project.reply_check_notes || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[150px]">
                          {editMode ? (
                            <Textarea
                              value={editData[Number(project.id)]?.remarks || project.remarks || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], remarks: e.target.value }
                              }))}
                              className="w-full h-12 text-xs p-1 resize-none"
                              rows={2}
                            />
                          ) : (
                            project.remarks || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[150px]">
                          {editMode ? (
                            <Textarea
                              value={editData[Number(project.id)]?.complaints_requests || project.complaints_requests || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], complaints_requests: e.target.value }
                              }))}
                              className="w-full h-12 text-xs p-1 resize-none"
                              rows={2}
                            />
                          ) : (
                            project.complaints_requests || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              value={editData[Number(project.id)]?.director || project.director || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], director: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            project.director || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              value={editData[Number(project.id)]?.operator || project.operator || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], operator: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            project.operator || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              value={editData[Number(project.id)]?.sales_person || project.sales_person || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], sales_person: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            project.sales_person || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              type="date"
                              value={editData[Number(project.id)]?.operation_start_date || project.operation_start_date || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], operation_start_date: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            formatDate(project.operation_start_date || "")
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[80px]">
                          {editMode ? (
                            <Input
                              type="date"
                              value={editData[Number(project.id)]?.expected_end_date || project.expected_end_date || ''}
                              onChange={(e) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], expected_end_date: e.target.value }
                              }))}
                              className="h-8 text-xs"
                            />
                          ) : (
                            formatDate(project.expected_end_date || "")
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[100px]">
                          {editMode ? (
                            <Select
                              value={editData[Number(project.id)]?.service_type_id?.toString() || ''}
                              onValueChange={(value) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], service_type_id: parseInt(value) }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="サービスを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceTypes.map((service) => (
                                  <SelectItem key={service.id} value={service.id.toString()} className="text-xs">
                                    {service.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            project.service_type || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[80px]">
                          {editMode ? (
                            <Select
                              value={editData[Number(project.id)]?.media_type_id?.toString() || project.media_type_id?.toString() || ''}
                              onValueChange={(value) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], media_type_id: parseInt(value) }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="媒体を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {mediaTypes.map((media) => (
                                  <SelectItem key={media.id} value={media.id.toString()} className="text-xs">
                                    {media.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            project.media_type || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[100px]">
                          {editMode ? (
                            <Select
                              value={editData[Number(project.id)]?.regular_meeting_status_id?.toString() || ''}
                              onValueChange={(value) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], regular_meeting_status_id: parseInt(value) }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="定例会ステータスを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {meetingStatuses.map((status) => (
                                  <SelectItem key={status.id} value={status.id.toString()} className="text-xs">
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            project.regular_meeting_status || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-xs min-w-[80px]">
                          {editMode ? (
                            <Select
                              value={editData[Number(project.id)]?.list_availability_id?.toString() || project.list_availability_id?.toString() || ''}
                              onValueChange={(value) => setEditData(prev => ({
                                ...prev,
                                [Number(project.id)]: { ...prev[Number(project.id)], list_availability_id: parseInt(value) }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="リスト有無を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {listAvailabilities.map((availability) => (
                                  <SelectItem key={availability.id} value={availability.id.toString()} className="text-xs">
                                    {availability.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            project.list_availability || '-'
                          )}
                        </td>
                        <td className="p-2 align-middle h-16 text-center text-xs min-w-[60px]">
                          <div className="font-medium text-blue-600">
                            {project.company_count || 0}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
