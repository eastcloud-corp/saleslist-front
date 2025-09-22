"use client"

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProjectForm } from "@/components/projects/project-form"
import { useProjects } from "@/hooks/use-projects"
import { useClients } from "@/hooks/use-clients"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import { createLogger } from "@/lib/logger"
import type { Project } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FolderOpen, Edit3, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ProjectTableRow, { STICKY_PROJECT_WIDTH } from "./components/project-table-row"
import { ProjectHistoryDialog } from "./components/project-history-dialog"

const pageLogger = createLogger("projects:page")

const DEFAULT_FILTERS = {
  search: "",
  client: "all",
  progress_status: "all",
  service_type: "all",
}

export default function ProjectsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Record<number, Partial<Project>>>({})
  const [editVisibleCount, setEditVisibleCount] = useState<number>(Infinity)
  const [progressStatuses, setProgressStatuses] = useState<Array<{ id: number; name: string }>>([])
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: number; name: string }>>([])
  const [meetingStatuses, setMeetingStatuses] = useState<Array<{ id: number; name: string }>>([])
  const [mediaTypes, setMediaTypes] = useState<Array<{ id: number; name: string }>>([])
  const [listImportSources, setListImportSources] = useState<Array<{ id: number; name: string }>>([])
  const [listAvailabilities, setListAvailabilities] = useState<Array<{ id: number; name: string }>>([])
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [historyProject, setHistoryProject] = useState<Project | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const activeFilters = useMemo(() => {
    const params: Record<string, string> = {}
    if (appliedFilters.search.trim()) {
      params.search = appliedFilters.search.trim()
    }
    if (appliedFilters.client !== "all") {
      params.client = appliedFilters.client
    }
    if (appliedFilters.progress_status !== "all") {
      params.progress_status = appliedFilters.progress_status
    }
    if (appliedFilters.service_type !== "all") {
      params.service_type = appliedFilters.service_type
    }
    return params
  }, [appliedFilters])

  const filterHash = useMemo(() => {
    const entries = Object.entries(activeFilters)
    if (!entries.length) return 'default'
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
  }, [activeFilters])

  const hasActiveFilters = useMemo(() => Object.keys(activeFilters).length > 0, [activeFilters])

  const filtersChanged = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters)
  }, [pendingFilters, appliedFilters])

  const { projects, isLoading, error, createProject, refetch, pagination } = useProjects({
    filters: activeFilters,
  })
  const { clients, loading: clientsLoading } = useClients({ limit: 200, filters: { is_active: true } })
  const { toast } = useToast()
  const [isAcquiringLock, setIsAcquiringLock] = useState(false)
  const [lastLockDuration, setLastLockDuration] = useState<number | null>(null)
  const [isPageLocked, setIsPageLocked] = useState(false)
  const lockParamsRef = useRef({ page: 1, page_size: 20, filter_hash: "default" })
  const filtersDisabled = editMode
  const totalProjects = pagination?.total ?? projects.length
  const visibleProjects = editMode ? projects.slice(0, editVisibleCount) : projects
  const [isModePending, startModeTransition] = useTransition()

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
        
      } catch (error) {
        console.error('マスターデータ取得エラー:', error)
      }
    }
    fetchMasterData()
  }, [])
  const handleFilterReset = () => {
    setPendingFilters({ ...DEFAULT_FILTERS })
    setAppliedFilters({ ...DEFAULT_FILTERS })
  }

  useEffect(() => {
    if (editMode) {
      const initialCount = Math.min(12, projects.length || 0)
      setEditVisibleCount(initialCount || projects.length)
    } else {
      setEditVisibleCount(projects.length)
    }
  }, [editMode, projects.length])

  const handleOpenHistory = useCallback((project: Project) => {
    setHistoryProject(project)
    setIsHistoryOpen(true)
  }, [])

  const updateProjectEdit = useCallback((projectId: number, changes: Partial<Project>) => {
    setEditData((prev) => {
      const previous = prev[projectId] ?? {}
      const merged = { ...previous, ...changes }
      const sanitizedEntries = Object.entries(merged).filter(([, value]) => value !== undefined)

      if (sanitizedEntries.length === 0) {
        const { [projectId]: _removed, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [projectId]: Object.fromEntries(sanitizedEntries) as Partial<Project>,
      }
    })
  }, [])

  const handleSaveAll = async (): Promise<boolean> => {

    const changedProjectIds = Object.keys(editData)
      .filter((projectId) => {
        const changes = editData[Number(projectId)]
        return changes && Object.keys(changes).length > 0
      })
      .map((id) => Number(id))


    if (changedProjectIds.length === 0) {
      toast({
        title: '変更はありません',
        description: '更新対象の入力はありませんでした。',
      })
      return true
    }

    try {
      const bulkItems = changedProjectIds
        .map((projectId) => {
          const changes = editData[projectId]
          if (!changes) return null

          const payload = Object.fromEntries(
            Object.entries(changes).filter(([, value]) => value !== undefined)
          )

          if (Object.keys(payload).length === 0) return null

          return {
            project_id: projectId,
            data: payload,
            reason: 'Bulk partial update via UI',
          }
        })
        .filter(Boolean) as Array<{ project_id: number; data: Record<string, unknown>; reason: string }>

      if (bulkItems.length === 0) {
        toast({
          title: '変更はありません',
          description: '更新対象の入力はありませんでした。',
        })
        return true
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.PROJECT_BULK_PARTIAL_UPDATE,
        { items: bulkItems },
      )

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`案件の一括更新に失敗しました (${response.status}) ${detail}`)
      }

      const result = await response.json()
      if (!result?.success) {
        const errorMessage = result?.error || '案件の一括更新に失敗しました'
        throw new Error(errorMessage)
      }

      setEditData({})
      await refetch()
      toast({
        title: '保存しました',
        description: `${result.updated_count ?? changedProjectIds.length}件の案件を更新しました。`,
      })
      return true
    } catch (error) {
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
      }
    } catch (error) {
    } finally {
      setIsPageLocked(false)
    }
  }, [isPageLocked])

  useEffect(() => {
    return () => {
      if (isPageLocked) {
      }
    }
  }, [isPageLocked, releasePageLock])

  const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  const handleEditModeToggle = async () => {
    if (!editMode) {
      setIsAcquiringLock(true)
      const params = {
        page: pagination?.page || 1,
        page_size: pagination?.limit || Math.max(projects.length, 20),
        filter_hash: filterHash,
      }

      const startedAt = getNow()
      let lockSuccess = false
      let statusCode: number | undefined
      let errorMessage: string | undefined

      try {
        const response = await apiClient.post('/projects/page-lock/', params)
        statusCode = response.status

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
          errorMessage = detail
          return
        }

        lockParamsRef.current = params
        startModeTransition(() => {
          setIsPageLocked(true)
          setEditMode(true)
        })
        lockSuccess = true
        toast({
          title: '編集モードを開始しました',
          description: '入力後に「編集終了」で保存してください。',
        })
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error)
        toast({
          title: '編集モードを開始できません',
          description: error instanceof Error ? error.message : 'ロック取得中にエラーが発生しました。',
          variant: 'destructive',
        })
      } finally {
        const duration = Math.max(0, getNow() - startedAt)
        setLastLockDuration(duration)
        pageLogger.info('page-lock attempt finished', {
          duration_ms: Math.round(duration),
          success: lockSuccess,
          status_code: statusCode,
          page: params.page,
          page_size: params.page_size,
          filter_hash: params.filter_hash,
          error: errorMessage,
        })
        setIsAcquiringLock(false)
      }
    } else {
      const saved = await handleSaveAll()
      if (saved) {
        await releasePageLock()
        setEditMode(false)
        setEditVisibleCount(projects.length)
        toast({
          title: '編集モードを終了しました',
          description: '最新のデータに更新しました。',
        })
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
              disabled={isAcquiringLock || isModePending}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isAcquiringLock ? 'ロック取得中...' : editMode ? '編集完了' : '編集モード'}
              {!isAcquiringLock && (
                <span className="ml-1 text-xs">({editMode ? 'OFF' : 'ON'})</span>
              )}
            </Button>
            {!isAcquiringLock && lastLockDuration !== null && (
              <span className="self-center text-xs text-muted-foreground">
                直近ロック: {Math.round(lastLockDuration)}ms
              </span>
            )}
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
                    value={pendingFilters.search}
                    onChange={(event) =>
                      setPendingFilters((prev) => ({ ...prev, search: event.target.value }))
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
                  value={pendingFilters.client}
                  onValueChange={(value) =>
                    setPendingFilters((prev) => ({ ...prev, client: value }))
                  }
                  disabled={filtersDisabled || clientsLoading}
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
                  value={pendingFilters.progress_status}
                  onValueChange={(value) =>
                    setPendingFilters((prev) => ({ ...prev, progress_status: value }))
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
                  value={pendingFilters.service_type}
                  onValueChange={(value) =>
                    setPendingFilters((prev) => ({ ...prev, service_type: value }))
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
                  disabled={(!hasActiveFilters && !filtersChanged) || filtersDisabled}
                >
                  フィルターをクリア
                </Button>
                <Button
                  type="button"
                  onClick={() => setAppliedFilters({ ...pendingFilters })}
                  disabled={!filtersChanged || filtersDisabled}
                >
                  <Search className="mr-2 h-4 w-4" />検索
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
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
              <thead>
                <tr className="border-b">
                  <th
                    className="sticky left-0 z-20 h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground bg-background min-w-[200px]"
                  >
                    案件名
                  </th>
                  <th
                    className="sticky z-20 h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground bg-background min-w-[200px]"
                    style={{ left: `${STICKY_PROJECT_WIDTH}px` }}
                  >
                    クライアント
                  </th>
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
                  <th className="h-10 px-2 text-center align-middle text-xs font-medium text-muted-foreground min-w-[120px]">履歴</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((project) => (
                  <ProjectTableRow
                    key={project.id}
                    project={project}
                    editMode={editMode}
                    isPending={false}
                    pendingChanges={editData[Number(project.id)]}
                    progressStatuses={progressStatuses}
                    serviceTypes={serviceTypes}
                    meetingStatuses={meetingStatuses}
                    mediaTypes={mediaTypes}
                    listImportSources={listImportSources}
                    listAvailabilities={listAvailabilities}
                    onFieldChange={updateProjectEdit}
                    onOpenHistory={handleOpenHistory}
                  />
                ))}
              </tbody>
            </table>
            {editMode && visibleProjects.length < projects.length && (
              <div className="flex justify-center border-t bg-muted/30 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditVisibleCount((prev) => Math.min(prev + 10, projects.length))
                  }}
                >
                  さらに{Math.min(projects.length - visibleProjects.length, 10)}件を表示
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <ProjectHistoryDialog
        project={historyProject}
        open={isHistoryOpen}
        onOpenChange={(open) => {
          setIsHistoryOpen(open)
          if (!open) {
            setHistoryProject(null)
          }
        }}
        onRestored={async () => {
          await refetch()
        }}
      />
    </MainLayout>
  )
}
