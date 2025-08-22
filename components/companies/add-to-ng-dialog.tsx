"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useClients } from "@/hooks/use-clients"
import { useNGList } from "@/hooks/use-ng-list"
import type { Company } from "@/lib/types"
import { Shield, AlertTriangle } from "lucide-react"

interface AddToNGDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess?: () => void
}

export function AddToNGDialog({ open, onOpenChange, company, onSuccess }: AddToNGDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { clients, isLoading: clientsLoading } = useClients({}, 1, 100)
  const { addNGCompany } = useNGList(selectedClientId ? Number.parseInt(selectedClientId) : 0)

  const handleSubmit = async () => {
    if (!company || !selectedClientId || !reason.trim()) return

    setIsSubmitting(true)
    try {
      await addNGCompany({
        company_name: company.name,
        reason: reason.trim(),
        company_id: company.id,
      })

      onSuccess?.()
      onOpenChange(false)
      setSelectedClientId("")
      setReason("")
    } catch (error) {
      console.error("NG企業登録に失敗しました:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedClientId("")
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            NG企業として登録
          </DialogTitle>
        </DialogHeader>

        {company && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">登録対象企業</span>
              </div>
              <p className="text-sm text-amber-700">{company.name}</p>
              <p className="text-xs text-amber-600 mt-1">
                {company.industry} | {company.prefecture}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-select">クライアント選択 *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={clientsLoading ? "読み込み中..." : "クライアントを選択してください"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">NG理由 *</Label>
              <Textarea
                id="reason"
                placeholder="NG企業として登録する理由を入力してください"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button onClick={handleSubmit} disabled={!selectedClientId || !reason.trim() || isSubmitting}>
                {isSubmitting ? "登録中..." : "NG企業として登録"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
