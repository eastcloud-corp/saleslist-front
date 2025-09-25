"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import { useToast } from "@/hooks/use-toast"
import type { Project, ProjectSnapshot } from "@/lib/types"
import { cn } from "@/lib/utils"

const HISTORY_PAGE_SIZE = 25
const HISTORY_DAYS = 7

const OVERVIEW_LABELS: Record<string, string> = {
  name: "案件名",
  client_name: "クライアント",
  progress_status: "進行状況",
  service_type: "サービス",
  media_type: "媒体",
  director: "ディレクター",
  operator: "運用者",
  sales_person: "営業",
  appointment_count: "アポ数",
  approval_count: "承認数",
  reply_count: "返信数",
  friends_count: "友達数",
  expected_end_date: "終了予定日",
  operation_start_date: "運用開始日",
  situation: "状況",
}

type ProjectHistoryDialogProps = {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestored?: () => Promise<void> | void
}

type SnapshotResponse = {
  count?: number
  results?: ProjectSnapshot[]
} | ProjectSnapshot[]

function extractChangedFields(snapshot: ProjectSnapshot): string[] {
  if (snapshot.changed_fields && snapshot.changed_fields.length > 0) {
    return snapshot.changed_fields
  }

  if (!snapshot.reason) return []
  const parts = snapshot.reason.split(":", 2)
  if (parts.length < 2) return []
  return parts[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatDateTime(value: string): string {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString("ja-JP", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    return value
  }
}

function formatOverviewEntries(overview: ProjectSnapshot["project_overview"]): Array<{ key: string; label: string; value: string }> {
  if (!overview) return []

  return Object.entries(overview)
    .map(([key, rawValue]) => {
      const label = OVERVIEW_LABELS[key] ?? key
      let value: string

      if (rawValue == null || rawValue === "") {
        value = "-"
      } else if (typeof rawValue === "number") {
        value = rawValue.toString()
      } else if (typeof rawValue === "string" && (key.endsWith("_date") || key.endsWith("_at") || /date/i.test(key))) {
        value = formatDateTime(rawValue)
      } else {
        value = String(rawValue)
      }

      return { key, label, value }
    })
}

export function ProjectHistoryDialog({ project, open, onOpenChange, onRestored }: ProjectHistoryDialogProps) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<number | null>(null)
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<number | null>(null)
  const { toast } = useToast()

  const projectId = project ? String(project.id) : null

  const fetchSnapshots = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PROJECT_SNAPSHOTS(projectId)}?page_size=${HISTORY_PAGE_SIZE}`,
      )

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`履歴の取得に失敗しました (${response.status}) ${detail}`)
      }

      const data: SnapshotResponse = await response.json()
      const snapshotList = Array.isArray(data) ? data : data.results ?? []
      setSnapshots(snapshotList)
    } catch (fetchError) {
      console.error("[ProjectHistoryDialog] failed to fetch snapshots", fetchError)
      setError(fetchError instanceof Error ? fetchError.message : "履歴の取得でエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open && projectId) {
      void fetchSnapshots()
    }
    if (!open) {
      setSnapshots([])
      setError(null)
      setRestoringSnapshotId(null)
      setExpandedSnapshotId(null)
    }
  }, [open, projectId, fetchSnapshots])

  const recentSnapshots = useMemo(() => {
    if (!snapshots.length) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - HISTORY_DAYS)
    return snapshots.filter((snapshot) => {
      if (!snapshot.created_at) return false
      const createdAt = new Date(snapshot.created_at)
      return !Number.isNaN(createdAt.getTime()) && createdAt >= cutoff
    })
  }, [snapshots])

  const displaySnapshots = recentSnapshots.length > 0 ? recentSnapshots : snapshots
  const showFallbackNotice = recentSnapshots.length === 0 && snapshots.length > 0

  const handleRestore = useCallback(
    async (snapshotId: number) => {
      if (!projectId) return
      setRestoringSnapshotId(snapshotId)
      try {
        const response = await apiClient.post(
          API_CONFIG.ENDPOINTS.PROJECT_SNAPSHOT_RESTORE(projectId, String(snapshotId)),
          {},
        )

        if (!response.ok) {
          const detail = await response.text()
          throw new Error(`復元に失敗しました (${response.status}) ${detail}`)
        }

        toast({
          title: "スナップショットを復元しました",
          description: "案件の内容を更新しました。",
        })

        await Promise.all([
          fetchSnapshots(),
          onRestored ? Promise.resolve(onRestored()) : Promise.resolve(),
        ])
      } catch (restoreError) {
        console.error("[ProjectHistoryDialog] failed to restore snapshot", restoreError)
        toast({
          title: "復元に失敗しました",
          description:
            restoreError instanceof Error ? restoreError.message : "復元処理でエラーが発生しました。",
          variant: "destructive",
        })
      } finally {
        setRestoringSnapshotId(null)
      }
    },
    [projectId, fetchSnapshots, onRestored, toast],
  )

  const projectLabel = project?.name?.trim() || (project ? `案件 ${project.id}` : "案件")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1400px]">
        <DialogHeader>
          <DialogTitle>{projectLabel} の履歴</DialogTitle>
          <DialogDescription>
            過去{HISTORY_DAYS}日以内に保存されたスナップショットを表示します。必要に応じて復元操作を行うことができます。
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="md" text="履歴を読み込み中です" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : displaySnapshots.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            過去{HISTORY_DAYS}日以内の履歴は見つかりませんでした。
          </p>
        ) : (
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto pr-2">
            {showFallbackNotice && (
              <p className="mb-3 text-xs text-muted-foreground">
                過去{HISTORY_DAYS}日以内の履歴が無かったため、取得できる最新の履歴を表示しています。
              </p>
            )}
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">保存日時</TableHead>
                  <TableHead className="min-w-[120px]">操作種別</TableHead>
                  <TableHead className="min-w-[140px]">担当者</TableHead>
                  <TableHead className="min-w-[200px]">変更項目</TableHead>
                  <TableHead className="min-w-[240px]">概要</TableHead>
                  <TableHead className="min-w-[160px] text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySnapshots.map((snapshot) => {
                  const changed = extractChangedFields(snapshot)
                  const overviewEntries = formatOverviewEntries(snapshot.project_overview)
                  const summaryEntries = overviewEntries.slice(0, 6)
                  const isExpanded = expandedSnapshotId === snapshot.id
                  const missingChangedKeys = changed.filter(
                    (field) => !overviewEntries.some((entry) => entry.key === field),
                  )

                  return (
                    <Fragment key={snapshot.id}>
                      <TableRow>
                        <TableCell>{formatDateTime(snapshot.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {snapshot.source_label || snapshot.source || "操作"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {snapshot.created_by_name || (snapshot.created_by ? `ユーザー#${snapshot.created_by}` : "-")}
                        </TableCell>
                        <TableCell>
                          {changed.length ? (
                            <div className="flex flex-wrap gap-1">
                              {changed.map((field) => (
                                <Badge key={field} variant="outline" className="text-[10px]">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">記録なし</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {summaryEntries.length ? (
                            <div className="space-y-1 text-[11px] leading-tight">
                              {summaryEntries.map((entry) => (
                                <div key={entry.key}>
                                  <span className="text-muted-foreground">{entry.label}:</span> {entry.value}
                                </div>
                              ))}
                              {overviewEntries.length > summaryEntries.length && (
                                <span className="text-[10px] text-muted-foreground">ほか {overviewEntries.length - summaryEntries.length} 件</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">概要情報はありません</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setExpandedSnapshotId((prev) => (prev === snapshot.id ? null : snapshot.id))
                              }}
                            >
                              {isExpanded ? "詳細を閉じる" : "詳細を見る"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={restoringSnapshotId === snapshot.id}
                              onClick={() => handleRestore(snapshot.id)}
                            >
                              {restoringSnapshotId === snapshot.id ? "復元中..." : "この状態に戻す"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="rounded-md border border-border bg-muted/30 p-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>スナップショットID: {snapshot.id}</span>
                                {snapshot.reason && <span>理由: {snapshot.reason}</span>}
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                                {overviewEntries.length ? (
                                  overviewEntries.map((entry) => {
                                    const isChangedEntry = changed.includes(entry.key)
                                    return (
                                      <div
                                        key={entry.key}
                                        className={cn(
                                          "rounded border border-border/60 bg-background p-3 text-sm",
                                          isChangedEntry && "border-primary/60 bg-primary/5"
                                        )}
                                      >
                                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                                          <span>{entry.label}</span>
                                          {isChangedEntry && <Badge variant="default" className="text-[10px]">更新</Badge>}
                                        </div>
                                        <div className="mt-1 break-words text-sm text-foreground">{entry.value}</div>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <p className="text-sm text-muted-foreground">このスナップショットには概要情報がありません。</p>
                                )}
                              </div>
                              {missingChangedKeys.length > 0 && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                  表示対象外の項目が更新されています: {missingChangedKeys.join(", ")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
