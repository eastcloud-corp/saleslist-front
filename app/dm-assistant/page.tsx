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
  const [senderInfo, setSenderInfo] = useState("")
  const [productInfo, setProductInfo] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generation, setGeneration] = useState<DmGeneration | null>(null)
  const [clientSelectOpen, setClientSelectOpen] = useState(false)
  const { toast } = useToast()

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientInfo(formatClientInfo(client))
    toast({
      title: "送信先を選択しました",
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
        title: "送信先を入力してください",
        description: "送信先（DMの送り先）を入力してから生成してください。",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneration(null)

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.DM_ASSISTANT_GENERATE, {
        client_info: trimmed,
        sender_info: senderInfo.trim(),
        product_info: productInfo.trim(),
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
      if (selectedClient?.id && resultsList.length > 0) {
        try {
          await apiClient.post(
            API_CONFIG.ENDPOINTS.CLIENT_DM_CANDIDATES(selectedClient.id),
            { results: resultsList }
          )
        } catch {
          // 保存失敗時はトーストのみ（生成結果は画面に表示済み）
        }
      }
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
            送信先（DMの送り先）・自社情報・商材を入力すると、自社から送信先へ送るDM文面を ChatGPT（GPT）と Gemini が生成します。
            計4つのメッセージ（GPT プロンプトA/B、Gemini プロンプトA/B）が表示されます。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>DM生成に必要な情報</CardTitle>
            <p className="text-sm text-muted-foreground">
              送信先（DMを受け取る相手）・自社（送信元）・商材を入力してください。送信先は必須です。
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="client-info">送信先（DMの送り先）</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientSelectOpen(true)}
                  disabled={isGenerating}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedClient ? "送信先を変更" : "送信先を選択"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                DMを受け取る相手の情報。企業名・担当者・業界・課題など。
              </p>
              {selectedClient && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">選択中の送信先:</span>
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
                    aria-label="送信先選択を解除"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Textarea
                id="client-info"
                placeholder="例：&#10;企業名：株式会社〇〇&#10;業界：IT・SaaS&#10;担当者：山田太郎 様（経営企画部）&#10;課題：営業効率化、リード獲得"
                value={clientInfo}
                onChange={(e) => setClientInfo(e.target.value)}
                rows={4}
                disabled={isGenerating}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-info">自社情報（送信元）</Label>
              <p className="text-xs text-muted-foreground">
                DMを送る側の情報。自社の企業名・担当者名・提供サービス・強みなど。
              </p>
              <Textarea
                id="sender-info"
                placeholder="例：&#10;企業名：自社名&#10;担当者：〇〇&#10;提供サービス：営業代行、リード獲得支援&#10;強み：専属営業、月〇件の商談設定実績"
                value={senderInfo}
                onChange={(e) => setSenderInfo(e.target.value)}
                rows={4}
                disabled={isGenerating}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-info">商材・サービス</Label>
              <p className="text-xs text-muted-foreground">
                提案する商材やサービスの内容・価格帯・実績など。
              </p>
              <Textarea
                id="product-info"
                placeholder="例：&#10;営業代行（月額〇万円〜）&#10;商談を月に〇件設定&#10;無料相談・ヒアリングから開始"
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                rows={3}
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
                送信先: <span className="font-medium text-foreground">{generation.clientName}</span>
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
