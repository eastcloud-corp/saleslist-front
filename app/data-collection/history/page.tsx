
"use client"

import { Fragment, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ListPaginationSummary } from "@/components/common/list-pagination-summary"
import type { DataCollectionFilters } from "@/hooks/use-data-collection"
import { useDataCollectionRuns } from "@/hooks/use-data-collection"
import { useToast } from "@/hooks/use-toast"
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const JOB_DEFINITIONS = [
  {
    value: "clone.corporate_number",
    label: "法人番号データ取得",
    description: "国税庁法人番号APIからレビュー候補を取得します",
    supportsCompanyIds: true,
    supportsSourceKeys: true,
  },
  {
    value: "clone.opendata",
    label: "オープンデータ取得",
    description: "自治体のオープンデータからレビュー候補を生成します",
    supportsCompanyIds: true,
    supportsSourceKeys: true,
  },
  {
    value: "clone.facebook_sync",
    label: "Facebookメトリクス同期",
    description: "Facebookページのメトリクスを更新します",
    supportsCompanyIds: false,
    supportsSourceKeys: false,
  },
  {
    value: "clone.ai_stub",
    label: "AI補完スタブ",
    description: "AI連携のテスト用タスク",
    supportsCompanyIds: false,
    supportsSourceKeys: false,
  },
] as const

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "待機中",
  RUNNING: "実行中",
  SUCCESS: "成功",
  FAILURE: "失敗",
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  QUEUED: "secondary",
  RUNNING: "outline",
  SUCCESS: "default",
  FAILURE: "destructive",
}

const JOB_LABEL_MAP = JOB_DEFINITIONS.reduce<Record<string, string>>((acc, job) => {
  acc[job.value] = job.label
  return acc
}, {})

const PAGE_SIZE = 100

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
}

function formatDuration(value: number): string {
  if (!value || value <= 0) return "-"
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  if (minutes === 0) return `${seconds}秒`
  return `${minutes}分${seconds.toString().padStart(2, "0")}秒`
}

function parseCommaSeparatedNumbers(input: string): number[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((num) => Number.isFinite(num))
}

function parseCommaSeparatedStrings(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

export default function DataCollectionHistoryPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<DataCollectionFilters>({})
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<string>(JOB_DEFINITIONS[0]?.value ?? "")
  const [companyIdsInput, setCompanyIdsInput] = useState("")
  const [sourceKeysInput, setSourceKeysInput] = useState("")
  const [isTriggering, setIsTriggering] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isNotReadyDialogOpen, setIsNotReadyDialogOpen] = useState(false)
  const [notReadyJobLabel, setNotReadyJobLabel] = useState<string>("")

  const { toast } = useToast()

  const { runs, loading, error, pagination, schedules, nextScheduledFor, refetch, triggerJob } =
    useDataCollectionRuns({ page, filters })

  const selectedJobDefinition = useMemo(
    () => JOB_DEFINITIONS.find((job) => job.value === selectedJob) ?? JOB_DEFINITIONS[0],
    [selectedJob],
  )

  const handleFilterChange = (key: keyof DataCollectionFilters, value: string) => {
    setPage(1)
    const normalized = value === "all" ? undefined : value || undefined
    setFilters((prev) => ({ ...prev, [key]: normalized }))
  }

  const handleTrigger = async () => {
    if (!selectedJob) return
    if (["clone.facebook_sync", "clone.corporate_number"].includes(selectedJob)) {
      setNotReadyJobLabel(JOB_LABEL_MAP[selectedJob] ?? "")
      setIsNotReadyDialogOpen(true)
      return
    }
    const options: Record<string, unknown> = {}
    if (selectedJobDefinition.supportsCompanyIds && companyIdsInput.trim()) {
      options.company_ids = parseCommaSeparatedNumbers(companyIdsInput)
    }
    if (selectedJobDefinition.supportsSourceKeys && sourceKeysInput.trim()) {
      options.source_keys = parseCommaSeparatedStrings(sourceKeysInput)
    }

    try {
      setIsTriggering(true)
      const response = await triggerJob(selectedJob, options)
      toast({
        title: "ジョブを起動しました",
        description: `実行ID: ${response.execution_uuid}`,
      })
      setCompanyIdsInput("")
      setSourceKeysInput("")
      await refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "ジョブの起動に失敗しました"
      toast({
        title: "ジョブの起動に失敗しました",
        description: message,
      })
    } finally {
      setIsTriggering(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "最新の情報取得に失敗しました"
      toast({
        title: "更新に失敗しました",
        description: message,
      })
    } finally {
      setIsRefreshing(false)
    }
  }
  const startItem = runs.length === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1
  const endItem = runs.length === 0 ? 0 : startItem + runs.length - 1

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">データ収集履歴</h1>
            <p className="text-muted-foreground">
              バッチジョブの実行状況やスケジュール、手動トリガーを管理します。
            </p>
          </div>
        </div>
        <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>データ収集履歴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 max-w-4xl lg:grid-cols-3">
            <div className="rounded-lg border p-4 bg-muted/40">
              <p className="text-sm text-muted-foreground">次回実行予定</p>
              <p className="mt-1 text-lg font-semibold">
                {nextScheduledFor ? formatDateTime(nextScheduledFor) : "スケジュールなし"}
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-muted/40 lg:col-span-2">
              <p className="text-sm text-muted-foreground">ジョブ別スケジュール</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {JOB_DEFINITIONS.map((job) => (
                  <div key={job.value} className="text-sm">
                    <p className="text-muted-foreground">{job.label}</p>
                    <p className="font-medium">
                      {schedules?.[job.value] ? formatDateTime(schedules[job.value]) : "スケジュールなし"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="text-base font-semibold">フィルター</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filter-job">ジョブ</Label>
                <Select
                  value={filters.job_name ?? "all"}
                  onValueChange={(value) => handleFilterChange("job_name", value)}
                >
                  <SelectTrigger id="filter-job">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {JOB_DEFINITIONS.map((job) => (
                      <SelectItem key={job.value} value={job.value}>
                        {job.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-status">ステータス</Label>
                <Select
                  value={filters.status ?? "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-started-after">開始日時 (From)</Label>
                <Input
                  id="filter-started-after"
                  type="datetime-local"
                  value={filters.started_after || ""}
                  onChange={(event) => handleFilterChange("started_after", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-started-before">開始日時 (To)</Label>
                <Input
                  id="filter-started-before"
                  type="datetime-local"
                  value={filters.started_before || ""}
                  onChange={(event) => handleFilterChange("started_before", event.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>手動トリガー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trigger-job">ジョブ</Label>
              <Select value={selectedJob} onValueChange={(value) => setSelectedJob(value)}>
                <SelectTrigger id="trigger-job">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_DEFINITIONS.map((job) => (
                    <SelectItem key={job.value} value={job.value}>
                      {job.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{selectedJobDefinition.description}</p>
            </div>

            {selectedJobDefinition.supportsCompanyIds ? (
              <div className="space-y-2">
                <Label htmlFor="company-ids">企業ID (カンマ区切り)</Label>
                <Input
                  id="company-ids"
                  placeholder="例: 101, 102, 103"
                  value={companyIdsInput}
                  onChange={(event) => setCompanyIdsInput(event.target.value)}
                />
              </div>
            ) : null}

            {selectedJobDefinition.supportsSourceKeys ? (
              <div className="space-y-2">
                <Label htmlFor="source-keys">データソースキー (カンマ区切り)</Label>
                <Input
                  id="source-keys"
                  placeholder="例: tokyo, osaka"
                  value={sourceKeysInput}
                  onChange={(event) => setSourceKeysInput(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          <Button onClick={handleTrigger} disabled={isTriggering}>
            {isTriggering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ジョブを起動
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>取得エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>実行履歴</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isTriggering}
          >
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            最新を取得
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListPaginationSummary
            totalCount={pagination.total}
            startItem={startItem}
            endItem={endItem}
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            isLoading={loading}
            isDisabled={isTriggering}
          />

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>開始</TableHead>
                  <TableHead>終了</TableHead>
                  <TableHead>ジョブ</TableHead>
                  <TableHead>データソース</TableHead>
                  <TableHead>処理件数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>所要時間</TableHead>
                  <TableHead>実行ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                      {loading ? "読み込み中..." : "データがありません"}
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => {
                    const isExpanded = expandedRow === run.execution_uuid
                    return (
                      <Fragment key={run.execution_uuid}>
                        <TableRow className="cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : run.execution_uuid)}>
                          <TableCell className="text-center">
                            {isExpanded ? <ChevronDown className="mx-auto h-4 w-4" /> : <ChevronRight className="mx-auto h-4 w-4" />}
                          </TableCell>
                          <TableCell>{formatDateTime(run.started_at)}</TableCell>
                          <TableCell>{formatDateTime(run.finished_at)}</TableCell>
                          <TableCell>{JOB_LABEL_MAP[run.job_name] ?? run.job_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(run.data_source || []).map((source) => (
                                <Badge key={source} variant="outline">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm leading-tight">
                              <div>取得: {run.input_count.toLocaleString()}</div>
                              <div>投入: {run.inserted_count.toLocaleString()}</div>
                              <div>スキップ: {run.skipped_count.toLocaleString()}</div>
                              <div>エラー: {run.error_count.toLocaleString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE_VARIANT[run.status] ?? "outline"}>
                              {STATUS_LABELS[run.status] ?? run.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDuration(run.duration_seconds)}</TableCell>
                          <TableCell>
                            <code className="text-xs text-muted-foreground">{run.execution_uuid}</code>
                          </TableCell>
                        </TableRow>
                        {isExpanded ? (
                          <TableRow key={`${run.execution_uuid}-details`} className="bg-muted/30">
                            <TableCell colSpan={9}>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <h3 className="text-sm font-semibold">エラー概要</h3>
                                  <div className="rounded-md border bg-background p-3 text-sm">
                                    {run.error_summary ? run.error_summary : "-"}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-sm font-semibold">スキップ内訳</h3>
                                  <div className="rounded-md border bg-background p-3 text-sm space-y-1">
                                    {run.skip_breakdown && Object.keys(run.skip_breakdown).length > 0 ? (
                                      Object.entries(run.skip_breakdown).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span>{key}</span>
                                          <span>{Number(value).toLocaleString()}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 space-y-2">
                                <h3 className="text-sm font-semibold">メタデータ</h3>
                                <div className="rounded-md border bg-background">
                                  <ScrollArea className="max-h-60 p-3 text-xs">
                                    <pre className="whitespace-pre-wrap break-words">
                                      {run.metadata ? JSON.stringify(run.metadata, null, 2) : "{}"}
                                    </pre>
                                  </ScrollArea>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <ListPaginationSummary
            totalCount={pagination.total}
            startItem={startItem}
            endItem={endItem}
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            isLoading={loading}
            isDisabled={isTriggering}
            className="pt-2"
          />
        </CardContent>
      </Card>
      <Dialog open={isNotReadyDialogOpen} onOpenChange={setIsNotReadyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>準備中の機能です</DialogTitle>
            <DialogDescription>
              {notReadyJobLabel || "このジョブ"} は現在整備中のため実行できません。対応完了までお待ちください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsNotReadyDialogOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </MainLayout>
  )
}
