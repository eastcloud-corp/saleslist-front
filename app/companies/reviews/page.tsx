"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompanyReviewDialog } from "@/components/companies/company-review-dialog"
import { useCompanyReviewBatches, useCompanyReviewBatch } from "@/hooks/use-company-reviews"
import type { CompanyReviewBatch } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { COMPANY_REVIEW_FILTER_OPTIONS, COMPANY_REVIEW_FIELD_LABELS } from "@/lib/company-review-fields"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Filter,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Building2,
  CloudDownload,
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: "pending", label: "未着手" },
  { value: "in_review", label: "レビュー中" },
  { value: "approved", label: "承認済み" },
  { value: "rejected", label: "否認済み" },
  { value: "partial", label: "一部承認" },
]

const SOURCE_OPTIONS = [
  { value: "RULE", label: "ルール" },
  { value: "AI", label: "AI提案" },
  { value: "MANUAL", label: "手動" },
]

const SOURCE_LABEL: Record<string, string> = {
  RULE: "ルール",
  AI: "AI提案",
  MANUAL: "手動",
}

const FIELD_FILTER_OPTIONS = COMPANY_REVIEW_FILTER_OPTIONS

const STATUS_LABEL: Record<string, string> = {
  pending: "未着手",
  in_review: "レビュー中",
  approved: "承認済み",
  rejected: "否認済み",
  partial: "一部承認",
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  in_review: "outline",
  approved: "default",
  rejected: "destructive",
  partial: "outline",
}

export default function CompanyReviewPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="p-6 text-muted-foreground">
            レビュー候補を読み込んでいます...
          </div>
        </MainLayout>
      }
    >
      <CompanyReviewContent />
    </Suspense>
  )
}

function CompanyReviewContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialStatusParam = searchParams?.get("status") ?? "pending"
  const initialFieldParam = searchParams?.get("field") ?? "all"
  const initialFilters = useMemo(
    () => ({ status: initialStatusParam, field: initialFieldParam }),
    [initialStatusParam, initialFieldParam],
  )
  const inferredEnvironment = process.env.NODE_ENV === "production" ? "prd" : "dev"
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || inferredEnvironment
  const isTestEnvironment = environment === "dev" || environment === "local"
  const shouldForceCorporateImport =
    process.env.NEXT_PUBLIC_COMPANY_REVIEW_FORCE === "true"
  const canRunCorporateImport = isTestEnvironment || shouldForceCorporateImport
  const canRunOpenDataIngestion = isTestEnvironment
  const {
    batches,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    lastUpdatedAt,
    generateSample,
    isGeneratingSample,
    runCorporateNumberImport,
    isRunningCorporateImport,
    runOpenDataIngestion,
    isRunningOpenDataIngestion,
  } = useCompanyReviewBatches(initialFilters)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const {
    batch: selectedBatch,
    isLoading: isDetailLoading,
    error: detailError,
    isSubmitting,
    decide,
    reset,
  } = useCompanyReviewBatch(selectedBatchId)

  const filteredBatches = useMemo(() => batches, [batches])

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value,
    }))
  }

  const handleSourceChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      sourceType: value,
    }))
  }

  const handleConfidenceChange = (value: string) => {
    const numeric = Number(value)
    setFilters((prev) => ({
      ...prev,
      confidenceMin: Number.isFinite(numeric) ? numeric : undefined,
    }))
  }

  const handleOpenDetail = (batchId: number) => {
    setSelectedBatchId(batchId)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedBatchId(null)
    reset()
  }

  const handleDecide = async (payload: Parameters<typeof decide>[0]) => {
    try {
      const result = await decide(payload)
      toast({
        title: "レビュー結果を反映しました",
        description: `${result.company_name} の更新内容が適用されました。`,
      })
      handleCloseDialog()
      await refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "レビュー結果の反映に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    }
  }

  const activeStatus = filters.status ?? "pending"
  const activeSource = filters.sourceType ?? "all"
  const confidenceMin = typeof filters.confidenceMin === "number" ? filters.confidenceMin : ""
  const activeField = filters.field ?? "all"

  const handleFieldChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      field: value,
    }))
  }

  const handleOpenDataIngestion = async () => {
    try {
      const result = await runOpenDataIngestion()
      toast({
        title: "オープンデータを取り込みました",
        description: `候補作成: ${result.created}件 / マッチ: ${result.matched}件`,
      })
    } catch (err) {
      toast({
        title: "オープンデータの取り込みに失敗しました",
        description: err instanceof Error ? err.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">会社情報自動取得レビュー</h1>
            <p className="text-gray-600 mt-1">
              ルールベース／AI 提案で収集した候補を確認し、正しい情報だけを企業マスタに反映します
            </p>
            {lastUpdatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                最終更新: {format(new Date(lastUpdatedAt), "yyyy/MM/dd HH:mm", { locale: ja })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              最新情報に更新
            </Button>
            {canRunCorporateImport && (
              <Button
                variant="secondary"
                onClick={async () => {
                try {
                  const result = await runCorporateNumberImport(
                    shouldForceCorporateImport ? { force: true } : {},
                  )
                    toast({
                      title: "法人番号自動取得バッチを実行しました",
                      description: result.summary ?? `新規候補: ${result.created_count}件`,
                    })
                  } catch (err) {
                    toast({
                      title: "法人番号自動取得バッチの実行に失敗しました",
                      description: err instanceof Error ? err.message : "不明なエラーが発生しました",
                      variant: "destructive",
                    })
                  }
                }}
                disabled={isRunningCorporateImport || isLoading}
              >
                {isRunningCorporateImport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    実行中...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    法人番号自動取得バッチ実行
                  </>
                )}
              </Button>
            )}
            {canRunOpenDataIngestion && (
              <Button
                variant="outline"
                onClick={handleOpenDataIngestion}
                disabled={isRunningOpenDataIngestion || isLoading}
              >
                {isRunningOpenDataIngestion ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    取り込み中...
                  </>
                ) : (
                  <>
                    <CloudDownload className="mr-2 h-4 w-4" />
                    オープンデータ取り込み
                  </>
                )}
              </Button>
            )}
            <Button
              variant="default"
              onClick={async () => {
                try {
                  const result = await generateSample(
                    activeField !== "all" ? { fields: [activeField] } : undefined,
                  )
                  toast({
                    title: "サンプル候補を生成しました",
                    description: `${result.created_count ?? 0} 件の候補がレビュー待ちに追加されました。`,
                  })
                } catch (err) {
                  toast({
                    title: "サンプル生成に失敗しました",
                    description: err instanceof Error ? err.message : "不明なエラーが発生しました",
                    variant: "destructive",
                  })
                }
              }}
              disabled={isGeneratingSample || isLoading}
            >
              {isGeneratingSample ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  サンプル候補生成
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              フィルタ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ステータス</label>
                <Select value={activeStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">未着手</SelectItem>
                    <SelectItem value="in_review">レビュー中</SelectItem>
                    <SelectItem value="approved">承認済み</SelectItem>
                    <SelectItem value="rejected">否認済み</SelectItem>
                    <SelectItem value="partial">一部承認</SelectItem>
                    <SelectItem value="all">すべて</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ソース</label>
                <Select value={activeSource} onValueChange={handleSourceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">最低信頼度</label>
                <Input
                  type="number"
                  placeholder="0〜100"
                  value={confidenceMin}
                  onChange={(event) => handleConfidenceChange(event.target.value)}
                  min={0}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">対象フィールド</label>
                <Select value={activeField} onValueChange={handleFieldChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setFilters({})
                }}
              >
                フィルタをクリア
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>レビュー待ち企業一覧</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>企業名</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>候補件数</TableHead>
                    <TableHead>ソース</TableHead>
                    <TableHead>取得日時</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead className="w-[160px] text-right">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={7}>
                          <div className="h-12 w-full animate-pulse rounded bg-gray-100" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && filteredBatches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        現在レビュー対象の企業はありません。
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredBatches.map((batch) => (
                    <ReviewTableRow
                      key={batch.id}
                      batch={batch}
                      onReview={() => handleOpenDetail(batch.id)}
                      fieldLabels={COMPANY_REVIEW_FIELD_LABELS}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CompanyReviewDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        batch={selectedBatch}
        isSubmitting={isSubmitting}
        isLoading={isDetailLoading && dialogOpen}
        onSubmit={handleDecide}
      />
      {detailError && dialogOpen && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          <AlertCircle className="h-4 w-4" />
          <span>{detailError}</span>
        </div>
      )}
    </MainLayout>
  )
}

function ReviewTableRow({
  batch,
  onReview,
  fieldLabels,
}: {
  batch: CompanyReviewBatch
  onReview: () => void
  fieldLabels: Record<string, string>
}) {
  const pendingClass =
    batch.pending_items > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"
  const hasCorporateNumber = (batch.candidate_fields ?? []).includes("corporate_number")
  const candidateFields = batch.candidate_fields ?? []
  const fieldBadges = candidateFields.map((field) => (
    <Badge
      key={`${batch.id}-${field}`}
      variant={field === "corporate_number" ? "outline" : "secondary"}
      className={
        field === "corporate_number"
          ? "border-sky-200 bg-sky-50 text-sky-700 text-xs"
          : "text-xs"
      }
    >
      {fieldLabels[field] ?? field}
    </Badge>
  ))

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{batch.company_name}</span>
          <span className="text-xs text-muted-foreground">ID: {batch.company_id}</span>
          {fieldBadges.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              {fieldBadges}
            </div>
          )}
          {hasCorporateNumber && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-sky-700">
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                法人番号
              </Badge>
              優先確認
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_BADGE_VARIANT[batch.status] ?? "secondary"}>
          {STATUS_LABEL[batch.status] ?? batch.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <span className={pendingClass}>{batch.pending_items}件</span>
          <span className="text-muted-foreground text-xs">全体: {batch.total_items}件</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {batch.sources.map((source) => (
            <Badge
              key={`${batch.id}-${source}`}
              variant={source === "AI" ? "destructive" : "secondary"}
              className="uppercase tracking-wide"
            >
              {SOURCE_LABEL[source] ?? source}
            </Badge>
          ))}
          {batch.sources.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {batch.latest_collected_at
          ? format(new Date(batch.latest_collected_at), "yyyy/MM/dd HH:mm", { locale: ja })
          : "不明"}
      </TableCell>
      <TableCell>
        {batch.assigned_to_name ? (
          <span className="text-sm text-muted-foreground">{batch.assigned_to_name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">未割当</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" onClick={onReview}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          レビュー
        </Button>
      </TableCell>
    </TableRow>
  )
}
