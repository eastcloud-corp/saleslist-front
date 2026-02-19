"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import { Loader2, Sparkles, MessageSquare, Users, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ClientSelectDialog } from "@/components/dm-assistant/client-select-dialog"
import type { Client } from "@/lib/types"

interface DmResult {
  provider: string
  prompt_type: string
  message: string
  error: string | null
}

/** 生成結果と紐づくクライアント情報（後々の保存・閲覧用） */
interface DmGeneration {
  clientId: number | null
  clientName: string | null
  clientInfo: string
  results: DmResult[]
  generatedAt: Date
}

function formatClientInfo(client: Client): string {
  const lines: string[] = []
  if (client.name) lines.push(`企業名: ${client.name}`)
  if (client.industry) lines.push(`業界: ${client.industry}`)
  if (client.contact_person) {
    const pos = client.contact_person_position ? `（${client.contact_person_position}）` : ""
    lines.push(`担当者: ${client.contact_person}${pos} 様`)
  }
  if (client.prefecture) lines.push(`所在地: ${client.prefecture}`)
  if (client.email) lines.push(`メール: ${client.email}`)
  if (client.phone) lines.push(`電話: ${client.phone}`)
  if (client.notes) lines.push(`備考: ${client.notes}`)
  return lines.join("\n")
}

const LABELS: Record<string, string> = {
  "gpt-a": "GPT プロンプトA",
  "gpt-b": "GPT プロンプトB",
  "gemini-a": "Gemini プロンプトA",
  "gemini-b": "Gemini プロンプトB",
}

export default function DmAssistantPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientInfo, setClientInfo] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generation, setGeneration] = useState<DmGeneration | null>(null)
  const [clientSelectOpen, setClientSelectOpen] = useState(false)
  const { toast } = useToast()

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientInfo(formatClientInfo(client))
    toast({
      title: "クライアントを選択しました",
      description: client.name,
    })
  }

  const handleClearClient = () => {
    setSelectedClient(null)
    setClientInfo("")
  }

  const handleGenerate = async () => {
    const trimmed = clientInfo.trim()
    if (!trimmed) {
      toast({
        title: "入力してください",
        description: "クライアント情報を入力してから生成してください。",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneration(null)

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.DM_ASSISTANT_GENERATE, {
        client_info: trimmed,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.client_info?.[0] || errData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const resultsList: DmResult[] = data.results || []
      setGeneration({
        clientId: selectedClient?.id ?? null,
        clientName: selectedClient?.name ?? null,
        clientInfo: trimmed,
        results: resultsList,
        generatedAt: new Date(),
      })
      toast({
        title: "生成完了",
        description: "4つのDM文面を生成しました。",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成に失敗しました"
      toast({
        title: "エラー",
        description: message,
        variant: "destructive",
      })
      setGeneration({
        clientId: selectedClient?.id ?? null,
        clientName: selectedClient?.name ?? null,
        clientInfo: trimmed,
        results: [],
        generatedAt: new Date(),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getResultKey = (r: DmResult) => `${r.provider}-${r.prompt_type}`

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DM作成補助</h1>
          <p className="text-muted-foreground mt-1">
            クライアント情報を入力すると、ChatGPT（GPT）と Gemini がそれぞれ2種類のプロンプトでDM文面を生成します。
            計4つのメッセージ（GPT プロンプトA/B、Gemini プロンプトA/B）が表示されます。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>クライアント情報</CardTitle>
            <p className="text-sm text-muted-foreground">
              企業名・担当者・業界・事業内容などをテキストで入力してください。
            </p>
            {selectedClient && (
              <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground">選択中のクライアント:</span>
                <Badge variant="secondary" className="font-normal">
                  {selectedClient.name}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearClient}
                  disabled={isGenerating}
                  className="ml-auto h-7 px-2 text-muted-foreground hover:text-foreground"
                  aria-label="クライアント選択を解除"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="client-info">クライアント情報</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientSelectOpen(true)}
                  disabled={isGenerating}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedClient ? "クライアントを変更" : "クライアントを選択"}
                </Button>
              </div>
              <Textarea
                id="client-info"
                placeholder="例：&#10;株式会社サンプル&#10;業界：ITコンサル&#10;担当者：山田太郎 様&#10;事業内容：DX推進支援、業務効率化コンサルティング"
                value={clientInfo}
                onChange={(e) => setClientInfo(e.target.value)}
                rows={6}
                disabled={isGenerating}
                className="resize-y"
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  DM文面を生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generation && generation.results.length > 0 && (
          <div className="space-y-4">
            {generation.clientName && (
              <p className="text-sm text-muted-foreground">
                クライアント: <span className="font-medium text-foreground">{generation.clientName}</span>
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
            {generation.results.map((r) => {
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
          </div>
        )}

        {generation && generation.results.length === 0 && !isGenerating && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              結果を取得できませんでした。APIキーが設定されているか確認してください。
            </CardContent>
          </Card>
        )}

        <ClientSelectDialog
          open={clientSelectOpen}
          onOpenChange={setClientSelectOpen}
          onSelect={handleClientSelect}
        />
      </div>
    </MainLayout>
  )
}
