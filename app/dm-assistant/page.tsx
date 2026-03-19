"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import { Loader2, Sparkles, MessageSquare, Users, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ClientSelectDialog } from "@/components/dm-assistant/client-select-dialog"
import { DmWizardDialog, type DmWizardAnswers } from "@/components/dm-assistant/dm-wizard-dialog"
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

type ParsedDmInput = {
  recipientInfo: string
  senderInfo: string
  productInfo: string
  goal: string
  tone: string
}

function parseUnifiedInput(inputText: string, selectedClient: Client | null): ParsedDmInput {
  const text = inputText.trim()
  const fallbackRecipient = selectedClient ? formatClientInfo(selectedClient) : ""

  // 見出し（【...】）で分割。見出しが無ければ全体を送信先側に寄せる。
  const sections: Record<string, string> = {}
  const re = /【([^】]+)】/g
  let lastIndex = 0
  let lastKey: string | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (lastKey != null) {
      sections[lastKey] = (sections[lastKey] || "") + text.slice(lastIndex, m.index).trim()
    }
    lastKey = m[1].trim()
    lastIndex = re.lastIndex
  }
  if (lastKey != null) {
    sections[lastKey] = (sections[lastKey] || "") + text.slice(lastIndex).trim()
  }

  const norm = (k: string) => k.replace(/\s+/g, "").toLowerCase()
  const pick = (keys: string[]) => {
    for (const k of Object.keys(sections)) {
      const nk = norm(k)
      if (keys.some((t) => nk.includes(t))) return sections[k].trim()
    }
    return ""
  }

  const recipientFromSections = pick(["送信先", "相手", "クライアント", "宛先", "recipient"])
  const senderInfo = pick(["自社", "送信元", "sender"])
  const productInfo = pick(["商材", "サービス", "商品", "product"])
  const goal = pick(["ゴール", "目的", "目標", "cta"])
  const tone = pick(["トーン", "文体", "雰囲気", "tone"])

  const recipientInfo =
    (recipientFromSections || "").trim() ||
    (fallbackRecipient || "").trim() ||
    // 見出しが無い場合は全体を送信先側として扱う
    (Object.keys(sections).length === 0 ? text : "")

  return { recipientInfo, senderInfo, productInfo, goal, tone }
}

export default function DmAssistantPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generation, setGeneration] = useState<DmGeneration | null>(null)
  const [clientSelectOpen, setClientSelectOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const { toast } = useToast()

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    toast({
      title: "送信先を選択しました",
      description: client.name,
    })
  }

  const handleClearClient = () => {
    setSelectedClient(null)
  }

  const handleGenerate = async (answers: DmWizardAnswers) => {
    const parsed = parseUnifiedInput(answers.inputText, selectedClient)
    if (!parsed.recipientInfo.trim()) {
      toast({
        title: "送信先（相手）の情報が必要です",
        description: "クライアントを選択するか、入力内に送信先情報（例：企業名・担当者など）を含めてください。",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneration(null)

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.DM_ASSISTANT_GENERATE, {
        client_info: parsed.recipientInfo,
        sender_info: [parsed.senderInfo, parsed.tone ? `文体・トーン: ${parsed.tone}` : ""]
          .filter(Boolean)
          .join("\n"),
        product_info: [parsed.productInfo, parsed.goal ? `ゴール: ${parsed.goal}` : ""]
          .filter(Boolean)
          .join("\n"),
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
        clientInfo: parsed.recipientInfo,
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
        clientInfo: parsed.recipientInfo,
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
            <CardTitle>DM生成（対話形式）</CardTitle>
            <p className="text-sm text-muted-foreground">
              まずは対話（質問→入力）で情報を整理し、最後にまとめてDM文面を生成します。送信先（相手）の情報は必須です。
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">送信先（クライアント）</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientSelectOpen(true)}
                  disabled={isGenerating}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedClient ? "送信先を変更" : "送信先を選択（任意）"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                送信先は必須ではありません。選択された場合のみ、生成したDMがクライアントに保存されます。
              </p>
              {selectedClient && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">選択中:</span>
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
            </div>

            <Button onClick={() => setWizardOpen(true)} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  対話を開始してDMを作成
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

        <DmWizardDialog
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          defaultRecipientInfo={selectedClient ? formatClientInfo(selectedClient) : ""}
          disabled={isGenerating}
          onComplete={handleGenerate}
        />
      </div>
    </MainLayout>
  )
}
