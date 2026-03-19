"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare, PenLine } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/lib/types"

interface DmResult {
  provider: string
  prompt_type: string
  message: string
  error: string | null
}

const LABELS: Record<string, string> = {
  "gpt-a": "GPT プロンプトA",
  "gpt-b": "GPT プロンプトB",
  "gemini-a": "Gemini プロンプトA",
  "gemini-b": "Gemini プロンプトB",
  "manual-a": "手入力DM",
}

interface DmCandidatesTabProps {
  client: Client
}

export function DmCandidatesTab({ client }: DmCandidatesTabProps) {
  const [results, setResults] = useState<DmResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualDraft, setManualDraft] = useState("")
  const [savingManual, setSavingManual] = useState(false)
  const { toast } = useToast()

  const getResultKey = (r: DmResult) => `${r.provider}-${r.prompt_type}`

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<{ results: DmResult[] | null }>(
        API_CONFIG.ENDPOINTS.CLIENT_DM_CANDIDATES(client.id)
      )
      const list = data.results && Array.isArray(data.results) ? data.results : null
      setResults(list)
      const manual = list?.find(
        (r) => r.provider === "manual" && (r.message || "").trim().length > 0
      )
      setManualDraft(manual?.message || "")
    } catch (e) {
      setError(e instanceof Error ? e.message : "DM候補の取得に失敗しました")
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [client.id])

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  const orderedAiResults: DmResult[] = results
    ? ([
        results.find((r) => r.provider === "gpt" && r.prompt_type === "a"),
        results.find((r) => r.provider === "gpt" && r.prompt_type === "b"),
        results.find((r) => r.provider === "gemini" && r.prompt_type === "a"),
        results.find((r) => r.provider === "gemini" && r.prompt_type === "b"),
      ].filter((r) => r != null) as DmResult[])
    : []

  const manualResults: DmResult[] = results
    ? results.filter((r) => r.provider === "manual" && (r.message || "").trim().length > 0)
    : []

  const hasAnyDisplayResults = orderedAiResults.length > 0 || manualResults.length > 0

  const handleSaveManual = async () => {
    const text = manualDraft.trim()
    if (!text) {
      toast({
        title: "DM文面を入力してください",
        description: "保存する内容が空です。",
        variant: "destructive",
      })
      return
    }
    setSavingManual(true)
    try {
      const manualEntry: DmResult = {
        provider: "manual",
        prompt_type: "a",
        message: text,
        error: null,
      }

      const baseResults = (results || []).filter((r) => r.provider !== "manual")
      const payloadResults = [...baseResults, manualEntry]

      await apiClient.post<{ results: DmResult[] }>(
        API_CONFIG.ENDPOINTS.CLIENT_DM_CANDIDATES(client.id),
        { results: payloadResults }
      )
      setManualDraft(manualEntry.message)
      toast({ title: "保存しました", description: "DM候補に登録しました。" })
      await fetchResults()
    } catch (e) {
      toast({
        title: "保存に失敗しました",
        description: e instanceof Error ? e.message : "不明なエラー",
        variant: "destructive",
      })
    } finally {
      setSavingManual(false)
    }
  }

  const handleDeleteManual = async () => {
    if (!manualResults.length) return
    setSavingManual(true)
    try {
      const baseResults = (results || []).filter((r) => r.provider !== "manual")
      await apiClient.post<{ results: DmResult[] }>(
        API_CONFIG.ENDPOINTS.CLIENT_DM_CANDIDATES(client.id),
        { results: baseResults }
      )
      setManualDraft("")
      toast({ title: "削除しました", description: "手入力DMを削除しました。" })
      await fetchResults()
    } catch (e) {
      toast({
        title: "削除に失敗しました",
        description: e instanceof Error ? e.message : "不明なエラー",
        variant: "destructive",
      })
    } finally {
      setSavingManual(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>DM候補</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {client.name ? `${client.name}向けの` : ""}
            DM文面（DM作成補助の保存・手入力の登録を表示）
          </p>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!loading && hasAnyDisplayResults && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[...orderedAiResults, ...manualResults].map((r, idx) => {
              const key = getResultKey(r)
              const label = LABELS[key] || `${r.provider} プロンプト${r.prompt_type}`
              return (
                <Card key={`${key}-${idx}`} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {r.provider === "manual" ? (
                        <PenLine className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {r.error ? (
                      <p className="text-sm text-destructive">{r.error}</p>
                    ) : (
                      <div className="rounded-md border bg-muted/30 p-4">
                        <p className="whitespace-pre-wrap text-sm">
                          {r.message || "（生成結果なし）"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`dm-manual-${client.id}`}>手入力DMを編集</Label>
                {manualResults.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDeleteManual()}
                    disabled={savingManual}
                  >
                    削除
                  </Button>
                )}
              </div>
              <Textarea
                id={`dm-manual-${client.id}`}
                placeholder="ここにDM文面を入力、または貼り付けてください。"
                value={manualDraft}
                onChange={(e) => setManualDraft(e.target.value)}
                rows={6}
                disabled={savingManual}
                className="resize-y font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button type="button" onClick={() => void handleSaveManual()} disabled={savingManual}>
                  {savingManual ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "変更を保存"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !results?.length && !error && (
        <Card>
          <CardContent className="space-y-4 py-6">
            <p className="text-sm text-muted-foreground text-center">
              DM候補がありません。下に文面を入力するかコピペして保存できます。
            </p>
            <div className="space-y-2 max-w-3xl mx-auto w-full">
              <Label htmlFor={`dm-manual-${client.id}`}>DM文面（手入力・コピペ）</Label>
              <Textarea
                id={`dm-manual-${client.id}`}
                placeholder="ここにDM文面を入力、または貼り付けてください。"
                value={manualDraft}
                onChange={(e) => setManualDraft(e.target.value)}
                rows={10}
                disabled={savingManual}
                className="resize-y font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button type="button" onClick={() => void handleSaveManual()} disabled={savingManual}>
                  {savingManual ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "DM候補として保存"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              DM作成補助から生成した場合も、ここと同じクライアントに紐づいて表示されます。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
