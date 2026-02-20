"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

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

/** モック用: 4つのDM候補メッセージ */
const MOCK_RESULTS: DmResult[] = [
  {
    provider: "gpt",
    prompt_type: "a",
    message: `【戦略要約】
狙い: 実績ベースの信頼構築 → 軽い打診でアポ誘導
訴求の軸: 類似業界での成功事例
フック: 無料相談・壁打ち

【① 3ラリー型】
1通目:
はじめまして。〇〇の代表の〇〇と申します。
進研ゼミやこどもちゃれんじでの商品開発経験を活かし、
経営者・専門家の「知識や経験」を高単価サービスに転換するお手伝いをしております。
△△さんのご活動、興味深く拝見しました。ぜひ繋がらせてください。

2通目:
ご返信ありがとうございます。お役に立てることがあれば幸いです。
よろしければ、一度オンラインで1on1の時間をいただけませんでしょうか。

3通目:
（Yes時）ありがとうございます。〇〇のリンクよりご希望日時をお選びください。
（Maybe時）無理にとは申しません。お考えのタイミングでお声がけください。

【② 2ラリー型】略
【③ 1ラリー完結型】略`,
    error: null,
  },
  {
    provider: "gpt",
    prompt_type: "b",
    message: `【戦略要約】
狙い: 共感・課題提起で入り、壁打ちを打診
訴求の軸: 方向性整理の悩みに寄り添う
A/B観点: トーンをカジュアル寄りに

【① 3ラリー型】
1通目:
初めまして。〇〇と申します。
経営者の方の「売れるサービス設計」を支援しております。
△△さん、事業の方向性で悩んでいらっしゃる方多いですよね。
お話聞けたら何かヒントになるかもしれません。よろしくお願いします。

2通目・3通目: （略）`,
    error: null,
  },
  {
    provider: "gemini",
    prompt_type: "a",
    message: `【戦略要約】
狙い: プロフェッショナルな第一印象で信頼獲得
訴求の軸: 実績と専門性
NG: 営業臭・過度な煽り

【① 3ラリー型】
1通目:
はじめまして。〇〇の代表・〇〇と申します。
進研ゼミやこどもちゃれんじでの商品開発経験を活かして、
経営者・専門家の「知識や経験」の商品化をお手伝いしております。
△△さんのご活動、とても興味深く拝見しました。
ぜひ繋がらせていただけたら嬉しいです。よろしくお願いいたします。

2通目:
ご返信ありがとうございます。あたたかいお言葉、とても嬉しいです。
よろしければ、一度オンラインで1on1のお時間をいただけませんでしょうか。

【② 2ラリー型】【③ 1ラリー完結型】略`,
    error: null,
  },
  {
    provider: "gemini",
    prompt_type: "b",
    message: `【戦略要約】
狙い: ソフトな入りで警戒を下げる
訴求の軸: 対話・情報交換の価値
A/B観点: フレンドリーなトーン

【① 3ラリー型】
1通目:
こんにちは。〇〇と申します。
サービス設計や事業づくりのお手伝いをしています。
△△さんの投稿、拝見しました。お話できたら嬉しいです。よろしくお願いします！

2通目:
返信ありがとうございます！
もしサービスの整理や今後の方向性でお考えのことがあれば、
ヒントを共有できるかもしれません。お気軽にご連絡ください。`,
    error: null,
  },
]

interface DmCandidatesTabProps {
  clientId: number
  clientName?: string
}

export function DmCandidatesTab({ clientId, clientName }: DmCandidatesTabProps) {
  const getResultKey = (r: DmResult) => `${r.provider}-${r.prompt_type}`

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>DM候補</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {clientName ? `${clientName}向けの` : ""}ChatGPT と Gemini で生成したDM文面（モック表示）
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_RESULTS.map((r) => {
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
  )
}
