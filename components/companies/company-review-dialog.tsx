import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { COMPANY_REVIEW_FIELD_LABELS } from "@/lib/company-review-fields"
import type {
  CompanyReviewBatchDetail,
  CompanyReviewDecisionAction,
  CompanyReviewDecisionPayload,
  CompanyReviewItem,
} from "@/lib/types"
import { Loader2, RefreshCcw, Check, XCircle, Pencil } from "lucide-react"

const FIELD_LABELS: Record<string, string> = COMPANY_REVIEW_FIELD_LABELS

const DECISION_LABEL: Record<CompanyReviewDecisionAction, string> = {
  approve: "承認",
  reject: "否認",
  update: "編集して承認",
}

const SOURCE_LABEL: Record<string, string> = {
  RULE: "ルール",
  AI: "AI提案",
  MANUAL: "手動",
}

const REJECTION_REASON_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "mismatch_company", label: "同名別会社" },
  { value: "invalid_value", label: "不正値" },
  { value: "outdated", label: "古い情報" },
  { value: "duplicate", label: "重複" },
  { value: "other", label: "その他" },
] as const

type LocalDecisionState = {
  decision: CompanyReviewDecisionAction
  comment: string
  newValue: string
  blockReproposal: boolean
  rejectionReasonCode: string
  rejectionReasonDetail: string
}

function getInitialState(item: CompanyReviewItem): LocalDecisionState {
  return {
    decision: "approve",
    comment: item.comment ?? "",
    newValue: item.candidate_value ?? "",
    blockReproposal: item.block_reproposal ?? false,
    rejectionReasonCode: item.rejection_reason_code ?? "mismatch_company",
    rejectionReasonDetail: item.rejection_reason_detail ?? "",
  }
}

interface CompanyReviewDialogProps {
  open: boolean
  onClose: () => void
  batch: CompanyReviewBatchDetail | null
  onSubmit: (payload: CompanyReviewDecisionPayload) => Promise<void>
  isSubmitting?: boolean
  isLoading?: boolean
}

export function CompanyReviewDialog({
  open,
  onClose,
  batch,
  onSubmit,
  isSubmitting = false,
  isLoading = false,
}: CompanyReviewDialogProps) {
  const [decisions, setDecisions] = useState<Record<number, LocalDecisionState>>({})
  const [lastSubmittedAt, setLastSubmittedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!batch || !batch.items) {
      setDecisions({})
      return
    }

    const initial: Record<number, LocalDecisionState> = {}
    batch.items.forEach((item) => {
      initial[item.id] = getInitialState(item)
    })
    setDecisions(initial)
  }, [batch])

  const handleDecisionChange = (itemId: number, decision: CompanyReviewDecisionAction) => {
    setDecisions((prev) => {
      const current =
        prev[itemId] ?? {
          decision: "approve" as CompanyReviewDecisionAction,
          comment: "",
          newValue: "",
          blockReproposal: false,
          rejectionReasonCode: "mismatch_company",
          rejectionReasonDetail: "",
        }
      const shouldEnableBlock = decision === "reject" && current.blockReproposal === undefined
      return {
        ...prev,
        [itemId]: {
          ...current,
          decision,
          blockReproposal:
            decision === "reject"
              ? shouldEnableBlock ? true : current.blockReproposal ?? true
              : current.blockReproposal ?? false,
        },
      }
    })
  }

  const handleCommentChange = (itemId: number, comment: string, item?: CompanyReviewItem) => {
    setDecisions((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ??
          (item
            ? getInitialState(item)
            : {
                decision: "approve",
                comment: "",
                newValue: "",
                blockReproposal: false,
                rejectionReasonCode: "mismatch_company",
                rejectionReasonDetail: "",
              })),
        comment,
      },
    }))
  }

  const handleNewValueChange = (itemId: number, newValue: string, item?: CompanyReviewItem) => {
    setDecisions((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ??
          (item
            ? getInitialState(item)
            : {
                decision: "approve",
                comment: "",
                newValue: "",
                blockReproposal: false,
                rejectionReasonCode: "mismatch_company",
                rejectionReasonDetail: "",
              })),
        newValue,
      },
    }))
  }

  const handleBlockChange = (itemId: number, block: boolean, item?: CompanyReviewItem) => {
    setDecisions((prev) => {
      const base =
        prev[itemId] ??
        (item
          ? getInitialState(item)
          : {
              decision: "approve",
              comment: "",
              newValue: "",
              blockReproposal: false,
              rejectionReasonCode: "mismatch_company",
              rejectionReasonDetail: "",
            })
      return {
        ...prev,
        [itemId]: {
          ...base,
          blockReproposal: block,
          rejectionReasonCode: block ? base.rejectionReasonCode ?? "mismatch_company" : base.rejectionReasonCode,
        },
      }
    })
  }

  const handleRejectionReasonChange = (itemId: number, value: string, item?: CompanyReviewItem) => {
    setDecisions((prev) => {
      const base =
        prev[itemId] ??
        (item
          ? getInitialState(item)
          : {
              decision: "approve",
              comment: "",
              newValue: "",
              blockReproposal: false,
              rejectionReasonCode: "mismatch_company",
              rejectionReasonDetail: "",
            })
      return {
        ...prev,
        [itemId]: {
          ...base,
          rejectionReasonCode: value,
        },
      }
    })
  }

  const handleRejectionDetailChange = (itemId: number, detail: string, item?: CompanyReviewItem) => {
    setDecisions((prev) => {
      const base =
        prev[itemId] ??
        (item
          ? getInitialState(item)
          : {
              decision: "approve",
              comment: "",
              newValue: "",
              blockReproposal: false,
              rejectionReasonCode: "mismatch_company",
              rejectionReasonDetail: "",
            })
      return {
        ...prev,
        [itemId]: {
          ...base,
          rejectionReasonDetail: detail,
        },
      }
    })
  }

  const payload = useMemo<CompanyReviewDecisionPayload | null>(() => {
    if (!batch || !batch.items) return null
    return {
      items: batch.items.map((item) => {
        const state = decisions[item.id] ?? getInitialState(item)
        const entry: {
          id: number
          decision: CompanyReviewDecisionAction
          comment?: string
          new_value?: string
          block_reproposal?: boolean
          rejection_reason_code?: string
          rejection_reason_detail?: string
        } = {
          id: item.id,
          decision: state.decision,
        }
        if (state.comment && state.comment.trim().length > 0) {
          entry.comment = state.comment.trim()
        }
        if (state.decision === "update") {
          entry.new_value = state.newValue ?? ""
        }
        if (state.decision === "reject") {
          entry.block_reproposal = state.blockReproposal ?? false
          if (state.rejectionReasonCode && state.rejectionReasonCode.length > 0) {
            entry.rejection_reason_code = state.rejectionReasonCode
          }
          if (state.rejectionReasonDetail && state.rejectionReasonDetail.trim().length > 0) {
            entry.rejection_reason_detail = state.rejectionReasonDetail.trim()
          }
        }
        return entry
      }),
    }
  }, [batch, decisions])

  const hasValidationError = useMemo(() => {
    if (!batch || !batch.items) return false
    return batch.items.some((item) => {
      const state = decisions[item.id] ?? getInitialState(item)
      if (state.decision === "update") {
        return !state.newValue || state.newValue.trim().length === 0
      }
      return false
    })
  }, [batch, decisions])

  const handleSubmit = async () => {
    if (!payload) return
    await onSubmit(payload)
    setLastSubmittedAt(new Date())
  }

  const renderDecisionButtons = (item: CompanyReviewItem, state: LocalDecisionState) => {
    const options: CompanyReviewDecisionAction[] = ["approve", "update", "reject"]
    return (
      <div className="flex items-center gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={state.decision === option ? "default" : "outline"}
            size="sm"
            className={cn(
              state.decision === option ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-600"
            )}
            onClick={() => handleDecisionChange(item.id, option)}
          >
            {option === "approve" && <Check className="mr-1 h-4 w-4" />}
            {option === "reject" && <XCircle className="mr-1 h-4 w-4" />}
            {option === "update" && <Pencil className="mr-1 h-4 w-4" />}
            {DECISION_LABEL[option]}
          </Button>
        ))}
      </div>
    )
  }


  const hasBatch = !!(batch && batch.items)
  const dialogTitle = batch?.company_name ? `レビュー: ${batch.company_name}` : "レビュー詳細"
  const showLoading = isLoading && !hasBatch

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <DialogContent className="w-full sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className={cn("font-semibold", hasBatch ? "text-2xl" : "text-xl")}>
            {dialogTitle}
          </DialogTitle>
          {hasBatch ? (
            <DialogDescription className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>ステータス: {batch.status}</span>
              {batch.latest_collected_at && (
                <span>
                  取得日時:{" "}
                  {format(new Date(batch.latest_collected_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                </span>
              )}
              {batch.sources.length > 0 && (
                <span className="flex items-center gap-2">
                  ソース:
                  {batch.sources.map((source) => (
                    <Badge
                      key={source}
                      variant={source === "AI" ? "destructive" : "secondary"}
                      className="uppercase tracking-wide"
                    >
                      {SOURCE_LABEL[source] ?? source}
                    </Badge>
                  ))}
                </span>
              )}
              {lastSubmittedAt && (
                <span>
                  直近保存: {format(lastSubmittedAt, "HH:mm:ss", { locale: ja })}
                </span>
              )}
            </DialogDescription>
          ) : (
            <DialogDescription className="text-sm text-muted-foreground">
              {showLoading ? "レビュー情報を読み込み中です..." : "表示するレビュー情報が見つかりません。"}
            </DialogDescription>
          )}
        </DialogHeader>

        {showLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mb-3 h-6 w-6 animate-spin" />
            <p>レビュー情報を読み込み中です...</p>
          </div>
        ) : hasBatch ? (
          <>
            <div className="max-h-[65vh] overflow-y-auto pr-4">
              <div className="space-y-4 pb-4">
                {batch.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">現在レビュー対象の項目はありません。</p>
                ) : (
                  batch.items.map((item) => {
                    const state = decisions[item.id] ?? getInitialState(item)
                    const fieldLabel = FIELD_LABELS[item.field] ?? item.field
                    const isUpdate = state.decision === "update"
                    const showDiff = (item.current_value || "") !== (state.newValue || item.candidate_value || "")

                    return (
                      <Card key={item.id} className="border border-gray-200">
                        <CardHeader className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {fieldLabel}
                              <span className="ml-2 text-xs font-medium text-muted-foreground">
                                ID: {item.id}
                              </span>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">信頼度: {item.confidence}</Badge>
                              <Badge
                                variant={item.source_type === "AI" ? "destructive" : "secondary"}
                                className="uppercase tracking-wide"
                              >
                                {SOURCE_LABEL[item.source_type] ?? item.source_type}
                              </Badge>
                              {item.block_reproposal && (
                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600">
                                  再提案ブロック中
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              現在値:{" "}
                              <span className="font-medium text-gray-900">
                                {item.current_value && item.current_value.trim().length > 0
                                  ? item.current_value
                                  : "未設定"}
                              </span>
                            </span>
                            <span>
                              候補値:{" "}
                              <span className="font-medium text-blue-600">
                                {item.candidate_value ?? "なし"}
                              </span>
                            </span>
                            {item.collected_at && (
                              <span>
                                取得日時: {format(new Date(item.collected_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                              </span>
                            )}
                            {item.source_detail && (
                              <span className="max-w-[320px] truncate" title={item.source_detail ?? ""}>
                                ソース詳細: {item.source_detail}
                              </span>
                            )}
                            {item.source_company_name && (
                              <span className="max-w-[320px] truncate" title={item.source_company_name ?? ""}>
                                取得企業名: {item.source_company_name}
                              </span>
                            )}
                            {item.source_corporate_number && (
                              <span>取得法人番号: {item.source_corporate_number}</span>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            {renderDecisionButtons(item, state)}
                            {isUpdate && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                値を編集して反映します
                              </Badge>
                            )}
                          </div>

                          {isUpdate ? (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">反映する値</label>
                              <Input
                                value={state.newValue}
                                onChange={(event) => handleNewValueChange(item.id, event.target.value, item)}
                                placeholder="反映する値を入力"
                              />
                              {(!state.newValue || state.newValue.trim().length === 0) && (
                                <p className="text-xs text-red-500">
                                  編集して承認する場合は値を入力してください。
                                </p>
                              )}
                            </div>
                          ) : (
                            showDiff && (
                              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                                新しい値が適用されます:{" "}
                                <span className="font-semibold">
                                  {state.newValue || item.candidate_value || ""}
                                </span>
                              </div>
                            )
                          )}

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">コメント</label>
                            <Textarea
                              value={state.comment}
                              onChange={(event) => handleCommentChange(item.id, event.target.value, item)}
                              placeholder="承認・否認の理由や補足があれば記載してください"
                            />
                          </div>

                          {state.decision === "reject" && (
                            <div className="space-y-4 rounded-md border border-red-100 bg-red-50 p-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-red-700">再提案制御</Label>
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`block-${item.id}`}
                                    checked={state.blockReproposal}
                                    onCheckedChange={(checked) => handleBlockChange(item.id, checked === true, item)}
                                  />
                                  <div className="space-y-1">
                                    <Label htmlFor={`block-${item.id}`} className="text-sm text-red-800">
                                      同じ値を再提案リストに戻さない
                                    </Label>
                                    <p className="text-xs text-red-700">
                                      同名別会社などの理由で誤提案だった場合にチェックしてください。
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-red-700">否認理由</Label>
                                  <Select
                                    value={state.rejectionReasonCode ?? ""}
                                    onValueChange={(value) => handleRejectionReasonChange(item.id, value, item)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="否認理由を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {REJECTION_REASON_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-xs font-medium text-red-700">補足メモ</Label>
                                  <Textarea
                                    value={state.rejectionReasonDetail}
                                    onChange={(event) => handleRejectionDetailChange(item.id, event.target.value, item)}
                                    placeholder="否認理由の詳細があれば入力してください"
                                    className="min-h-[64px]"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !payload || hasValidationError}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    反映中...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    選択した内容で反映
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>レビュー対象のデータが読み込めませんでした。</p>
            <p className="mt-1 text-xs">もう一度やり直す場合は閉じて再度開いてください。</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
