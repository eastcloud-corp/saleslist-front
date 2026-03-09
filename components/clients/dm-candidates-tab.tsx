"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { LoadingSpinner } from "@/components/common/loading-spinner"
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
}

interface DmCandidatesTabProps {
  client: Client
}

export function DmCandidatesTab({ client }: DmCandidatesTabProps) {
  const [results, setResults] = useState<DmResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getResultKey = (r: DmResult) => `${r.provider}-${r.prompt_type}`

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiClient
      .get<{ results: DmResult[] | null }>(API_CONFIG.ENDPOINTS.CLIENT_DM_CANDIDATES(client.id))
      .then((data) => {
        if (!cancelled) {
          const list = data.results && Array.isArray(data.results) ? data.results : null
          setResults(list)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "DM候補の取得に失敗しました")
          setResults(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client.id])

  const orderedResults: DmResult[] = results
    ? ([
        results.find((r) => r.provider === "gpt" && r.prompt_type === "a"),
        results.find((r) => r.provider === "gpt" && r.prompt_type === "b"),
        results.find((r) => r.provider === "gemini" && r.prompt_type === "a"),
        results.find((r) => r.provider === "gemini" && r.prompt_type === "b"),
      ].filter((r) => r != null) as DmResult[])
    : []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>DM候補</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {client.name ? `${client.name}向けの` : ""}ChatGPT と Gemini で生成したDM文面（DM作成補助で保存した内容を表示）
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

      {!loading && orderedResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {orderedResults.map((r) => {
            const key = getResultKey(r)
            const label = LABELS[key] || `${r.provider} プロンプト${r.prompt_type}`
            return (
              <Card key={key} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {r.error ? (
                    <p className="text-sm text-destructive">{r.error}</p>
                  ) : (
                    <div className="rounded-md border bg-muted/30 p-4">
                      <p className="whitespace-pre-wrap text-sm">{r.message || "（生成結果なし）"}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && !results?.length && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              DM候補がありません。DM作成補助機能を利用して下さい。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
