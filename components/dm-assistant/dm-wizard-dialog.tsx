"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type DmWizardAnswers = {
  inputText: string
}

const EMPTY: DmWizardAnswers = { inputText: "" }

function buildDefaultTemplate(defaultRecipientInfo?: string) {
  const recipientBlock = defaultRecipientInfo?.trim()
    ? `【送信先】\n${defaultRecipientInfo.trim()}\n`
    : "【送信先】\n（企業名・担当者・業界・状況・課題など）\n"

  return [
    recipientBlock,
    "【自社】\n（会社名・担当者名・強み・実績など）\n",
    "【商材】\n（提案したいサービス内容・価格帯・実績など）\n",
    "【ゴール】\n（相手にしてほしい行動。例：15分のオンライン相談）\n",
    "【トーン】\n（丁寧/短め/押し売り感NG/敬語/絵文字なし等）\n",
  ].join("\n")
}

interface DmWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRecipientInfo?: string
  disabled?: boolean
  onComplete: (answers: DmWizardAnswers) => Promise<void> | void
}

export function DmWizardDialog({
  open,
  onOpenChange,
  defaultRecipientInfo,
  disabled,
  onComplete,
}: DmWizardDialogProps) {
  const [answers, setAnswers] = useState<DmWizardAnswers>(EMPTY)

  useEffect(() => {
    if (!open) return
    setAnswers((prev) => {
      const next = (prev.inputText || "").trim()
      if (next.length > 0) return prev
      return { ...EMPTY, inputText: buildDefaultTemplate(defaultRecipientInfo) }
    })
  }, [open, defaultRecipientInfo])

  const handleComplete = async () => {
    if (answers.inputText.trim().length === 0) return
    await onComplete({ inputText: answers.inputText.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>DM作成</DialogTitle>
          <DialogDescription>
            1つの入力欄に、送信先・自社・商材など必要情報をまとめて入力してください。完成後にまとめてDM文面を生成します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="dm-wizard-input" className="text-base">
            入力（まとめてOK）
          </Label>
          <p className="text-xs text-muted-foreground">
            `【送信先】` `【自社】` `【商材】` のような見出しがあると、内部で整理して生成品質を安定させやすいです。
          </p>
          <Textarea
            id="dm-wizard-input"
            value={answers.inputText}
            onChange={(e) => setAnswers({ inputText: e.target.value })}
            rows={14}
            disabled={disabled}
            className="resize-y"
          />
          {answers.inputText.trim().length === 0 && (
            <p className="text-xs text-destructive">入力は必須です。</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleComplete} disabled={disabled || answers.inputText.trim().length === 0}>
            生成する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

