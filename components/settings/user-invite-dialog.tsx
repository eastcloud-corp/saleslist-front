"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus } from "lucide-react"
import { useUsers, type UserInvitation } from "@/hooks/use-users"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"

export function UserInviteDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserInvitation["role"]>("user")
  const [message, setMessage] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const { inviteUser, loading } = useUsers()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email) {
      setLocalError("メールアドレスを入力してください")
      return
    }

    const invitation: UserInvitation = {
      email,
      role,
      message: message || undefined,
    }

    const result = await inviteUser(invitation)

    if (result.success) {
      setOpen(false)
      setEmail("")
      setRole("user")
      setMessage("")
    } else {
      setLocalError(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          ユーザー招待
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新規ユーザー招待</DialogTitle>
          <DialogDescription>新しいユーザーを招待して、システムへのアクセス権限を付与します。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">権限</Label>
              <Select value={role} onValueChange={(value: UserInvitation["role"]) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">閲覧者 - データの閲覧のみ</SelectItem>
                  <SelectItem value="user">一般ユーザー - データの編集可能</SelectItem>
                  <SelectItem value="admin">管理者 - 全ての操作が可能</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">招待メッセージ（任意）</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="招待の理由や追加情報を入力してください"
                rows={3}
              />
            </div>
            {localError && <ErrorAlert message={localError} />}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
              招待を送信
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
