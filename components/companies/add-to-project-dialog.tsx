"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import type { Company, Project, Client } from "@/lib/types"
import { apiClient } from "@/lib/api-client"

interface AddCompaniesResponse {
  message: string
  added_count: number
  errors: string[]
}

interface AddToProjectResult {
  projectId: number
  projectName: string
  addedCount: number
  errors: string[]
}

interface AddToProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  onCompleted?: (results: AddToProjectResult[]) => void
}

export function AddToProjectDialog({ open, onOpenChange, companies, onCompleted }: AddToProjectDialogProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing")
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projectSearch, setProjectSearch] = useState("")
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const eligibleCompanies = useMemo(
    () => companies.filter((company) => !company.ng_status?.is_ng && !company.is_global_ng),
    [companies]
  )

  const blockedCompanies = useMemo(
    () => companies.filter((company) => company.ng_status?.is_ng || company.is_global_ng),
    [companies]
  )

  const filteredProjects = useMemo(() => {
    const keyword = projectSearch.trim().toLowerCase()
    if (!keyword) return projects

    return projects.filter((project) => {
      const target = `${project.name} ${project.client_name || ""}`.toLowerCase()
      return target.includes(keyword)
    })
  }, [projectSearch, projects])

  const selectedProjectIdSet = useMemo(() => new Set(selectedProjectIds.map((id) => Number(id))), [selectedProjectIds])
  const filteredSelectedCount = useMemo(
    () => filteredProjects.filter((project) => selectedProjectIdSet.has(Number(project.id))).length,
    [filteredProjects, selectedProjectIdSet]
  )

  const filteredSelectionState = useMemo<true | false | "indeterminate">(() => {
    if (filteredProjects.length === 0 || filteredSelectedCount === 0) return false
    if (filteredSelectedCount === filteredProjects.length) return true
    return "indeterminate"
  }, [filteredProjects.length, filteredSelectedCount])

  const handleToggleAllFilteredProjects = useCallback(
    (checked: boolean) => {
      if (filteredProjects.length === 0) return

      if (!checked) {
        const filteredIds = new Set(filteredProjects.map((project) => Number(project.id)))
        setSelectedProjectIds((prev) => prev.filter((projectId) => !filteredIds.has(Number(projectId))))
        return
      }

      setSelectedProjectIds((prev) => {
        const next = new Set(prev)
        filteredProjects.forEach((project) => next.add(Number(project.id)))
        return Array.from(next)
      })
    },
    [filteredProjects]
  )

  const resetInternalState = useCallback(() => {
    setActiveTab("existing")
    setSelectedProjectIds([])
    setSelectedClientId(null)
    setNewProjectName("")
    setProjectSearch("")
    setFormError(null)
    setIsSubmitting(false)
  }, [])

  const fetchProjects = useCallback(async (keyword = '') => {
    setIsLoadingProjects(true)
    try {
      const searchParam = keyword ? `&search=${encodeURIComponent(keyword)}` : ''
      const response = await apiClient.get<{ results: Project[] }>(
        `/projects?management_mode=true&page=1&limit=200&ordering=-id${searchParam}`
      )
      setProjects(response.results || [])
    } catch (error) {
      console.error('案件一覧の取得に失敗しました:', error)
      setProjects([])
    } finally {
      setIsLoadingProjects(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true)
    try {
      const response = await apiClient.get<{ results: Client[] }>(`/clients/?page=1&page_size=100&ordering=-created_at`)
      setClients(response.results || [])
    } catch (error) {
      console.error('クライアント一覧の取得に失敗しました:', error)
      setClients([])
    } finally {
      setIsLoadingClients(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchClients()
    } else {
      resetInternalState()
    }
  }, [open, fetchClients, resetInternalState])

  useEffect(() => {
    if (!open) return
    const keyword = projectSearch.trim()
    fetchProjects(keyword)
  }, [open, projectSearch, fetchProjects])

  const handleAddToExistingProject = useCallback(async () => {
    if (selectedProjectIds.length === 0) {
      setFormError('案件を選択してください。')
      return
    }

    if (eligibleCompanies.length === 0) {
      setFormError('NG企業を除く選択可能な企業がありません。')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const aggregatedResults: AddToProjectResult[] = []
      const aggregatedErrors: string[] = []

      for (const projectId of selectedProjectIds) {
        const projectName = projects.find((project) => project.id === projectId)?.name || '選択した案件'
        try {
          const response = await apiClient.post<AddCompaniesResponse>(
            `/projects/${projectId}/add-companies/`,
            { company_ids: eligibleCompanies.map((company) => company.id) }
          )

          aggregatedResults.push({
            projectId,
            projectName,
            addedCount: response.added_count ?? 0,
            errors: response.errors ?? [],
          })

          if (response.errors?.length) {
            aggregatedErrors.push(...response.errors)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : '案件への追加に失敗しました。'
          aggregatedResults.push({
            projectId,
            projectName,
            addedCount: 0,
            errors: [message],
          })
          aggregatedErrors.push(`${projectName}: ${message}`)
        }
      }

      if (aggregatedResults.length > 0) {
        onCompleted?.(aggregatedResults)
        setSelectedProjectIds([])
      }

      if (aggregatedErrors.length > 0) {
        setFormError(aggregatedErrors.join('\n'))
      }
    } catch (error) {
      console.error('案件への企業追加処理に失敗しました:', error)
      setFormError(error instanceof Error ? error.message : '案件への追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }, [eligibleCompanies, onCompleted, projects, selectedProjectIds])

  const handleCreateProjectAndAdd = useCallback(async () => {
    if (!newProjectName.trim()) {
      setFormError('案件名を入力してください。')
      return
    }

    if (!selectedClientId) {
      setFormError('クライアントを選択してください。')
      return
    }

    if (eligibleCompanies.length === 0) {
      setFormError('NG企業を除く選択可能な企業がありません。')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const newProject = await apiClient.post<Project>(`/projects/`, {
        name: newProjectName.trim(),
        client_id: selectedClientId,
      })

      const response = await apiClient.post<AddCompaniesResponse>(
        `/projects/${newProject.id}/add-companies/`,
        { company_ids: eligibleCompanies.map((company) => company.id) }
      )

      onCompleted?.([
        {
          projectId: Number(newProject.id),
          projectName: newProject.name,
          addedCount: response.added_count || 0,
          errors: response.errors || [],
        },
      ])
    } catch (error) {
      console.error('新規案件の作成または企業追加に失敗しました:', error)
      setFormError(error instanceof Error ? error.message : '新規案件の作成に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }, [eligibleCompanies, newProjectName, onCompleted, selectedClientId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>案件に企業を追加</DialogTitle>
          <DialogDescription>
            選択した企業を既存の案件に追加するか、新規案件を作成して割り当てます。
          </DialogDescription>
        </DialogHeader>

        {companies.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">企業が選択されていません。</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
              <section className="space-y-3">
                <Label>選択中の企業</Label>
                <div className="max-h-52 overflow-y-auto rounded-md border p-3">
                  <div className="space-y-2">
                    {companies.map((company) => {
                      const isBlocked = blockedCompanies.some((blocked) => blocked.id === company.id)
                      return (
                        <div
                          key={company.id}
                          className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
                            isBlocked ? 'border-red-200 bg-red-50 text-red-700' : 'border-muted bg-background'
                          }`}
                        >
                          <span>{company.name}</span>
                          {isBlocked && <Badge variant="destructive">NG</Badge>}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  <div>利用可能: {eligibleCompanies.length}社 / 選択総数: {companies.length}社</div>
                  <div>NG企業は案件追加対象から自動的に除外されます。</div>
                </div>
              </section>

              <div className="space-y-6">
                {blockedCompanies.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTitle>NG企業が含まれています</AlertTitle>
                    <AlertDescription>
                      グローバルNGまたはクライアントNG企業は案件に追加できません。NG企業は自動的に除外されます。
                    </AlertDescription>
                  </Alert>
                )}

                {formError && (
                  <Alert variant="destructive">
                    <AlertTitle>エラーが発生しました</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <Tabs value={activeTab} onValueChange={(value) => {
                  setActiveTab(value as "existing" | "new")
                  setFormError(null)
                }}>
                  <TabsList>
                    <TabsTrigger value="existing">既存の案件に追加</TabsTrigger>
                    <TabsTrigger value="new">新規案件を作成</TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-search">案件検索</Label>
                      <Input
                        id="project-search"
                        placeholder="案件名やクライアント名で検索"
                        value={projectSearch}
                        onChange={(event) => setProjectSearch(event.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span>
                        選択中の案件: {selectedProjectIds.length} / {filteredProjects.length} 件
                      </span>
                      <span>表示件数は最大100件です。</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto rounded border bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">
                              <Checkbox
                                aria-label="表示中の案件を全選択"
                                checked={filteredSelectionState}
                                disabled={isSubmitting || filteredProjects.length === 0}
                                onCheckedChange={(value) => {
                                  const nextValue = value === true
                                  handleToggleAllFilteredProjects(nextValue)
                                }}
                              />
                            </TableHead>
                            <TableHead>案件名</TableHead>
                            <TableHead>クライアント</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingProjects ? (
                            <TableRow>
                              <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                                案件を読み込み中...
                              </TableCell>
                            </TableRow>
                          ) : filteredProjects.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                                該当する案件がありません。
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredProjects.map((project) => (
                              <TableRow key={project.id}>
                                <TableCell className="w-12">
                                  <Checkbox
                                    aria-label={`案件を選択: ${project.name}`}
                                    checked={selectedProjectIdSet.has(Number(project.id))}
                                    disabled={isSubmitting}
                                    onCheckedChange={(checked) => {
                                      setSelectedProjectIds((prev) => {
                                        const next = new Set(prev)
                                        if (checked) {
                                          next.add(Number(project.id))
                                        } else {
                                          next.delete(Number(project.id))
                                        }
                                        return Array.from(next)
                                      })
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{project.name}</TableCell>
                                <TableCell>{project.client_name || '―'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {selectedProjectIds.length > 1 && (
                      <div className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        選択した {selectedProjectIds.length} 件の案件へ順番に企業を追加します。案件ごとの結果は完了後のトーストで確認できます。
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddToExistingProject}
                        disabled={
                          isSubmitting || selectedProjectIds.length === 0 || eligibleCompanies.length === 0
                        }
                      >
                        {isSubmitting ? '追加中...' : `案件に追加 (${eligibleCompanies.length}社)`}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  <TabsContent value="new" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-project-name">案件名</Label>
                      <Input
                        id="new-project-name"
                        placeholder="新規案件名を入力"
                        value={newProjectName}
                        onChange={(event) => setNewProjectName(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-select">クライアントを選択</Label>
                      <Select
                        onValueChange={(value) => setSelectedClientId(Number(value))}
                        value={selectedClientId?.toString() || ""}
                        disabled={isLoadingClients}
                      >
                        <SelectTrigger id="client-select">
                          <SelectValue placeholder={isLoadingClients ? "読み込み中..." : "クライアントを選択"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {clients.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">利用可能なクライアントがありません。</div>
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

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateProjectAndAdd}
                        disabled={isSubmitting || !newProjectName.trim() || !selectedClientId || eligibleCompanies.length === 0}
                      >
                        {isSubmitting ? '作成中...' : '案件を作成して追加'}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
