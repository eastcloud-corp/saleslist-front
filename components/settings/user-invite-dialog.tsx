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
import { UserPlus, Copy, CheckCircle } from "lucide-react"
import { useUsers, type UserInvitation } from "@/hooks/use-users"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"

interface UserInviteDialogProps {
  onUserCreated?: () => void
}

export function UserInviteDialog({ onUserCreated }: UserInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserInvitation["role"]>("user")
  const [message, setMessage] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const { inviteUser, loading } = useUsers()

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(password)
  }

  const copyCredentials = async () => {
    if (createdUser) {
      const credentials = `メールアドレス: ${createdUser.email}\nパスワード: ${createdUser.password}`
      await navigator.clipboard.writeText(credentials)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email) {
      setLocalError("メールアドレスを入力してください")
      return
    }

    if (!password) {
      setLocalError("パスワードを入力してください")
      return
    }

    const invitation: UserInvitation & { password: string } = {
      email,
      password,
      role,
      message: message || undefined,
    }

    const result = await inviteUser(invitation)

    if (result.success) {
      setCreatedUser({ email, password })
      // 親コンポーネントのユーザー一覧を更新
      if (onUserCreated) {
        onUserCreated()
      }
    } else {
      setLocalError(result.message)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setEmail("")
      setPassword("")
      setRole("user")
      setMessage("")
      setCreatedUser(null)
      setCopied(false)
      setLocalError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          ユーザー作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{createdUser ? "ユーザー作成完了" : "新規ユーザー作成"}</DialogTitle>
          <DialogDescription>
            {createdUser
              ? "ユーザーが作成されました。以下の認証情報を別ツールで共有してください。"
              : "新しいユーザーを作成します。認証情報は別ツールで共有してください。"}
          </DialogDescription>
        </DialogHeader>

        {createdUser ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div>
                <Label className="text-sm font-medium">メールアドレス</Label>
                <p className="font-mono text-sm mt-1">{createdUser.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">パスワード</Label>
                <p className="font-mono text-sm mt-1">{createdUser.password}</p>
              </div>
            </div>
            <Button onClick={copyCredentials} className="w-full bg-transparent" variant="outline">
              {copied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  コピー完了
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  認証情報をコピー
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">この認証情報を安全な方法でユーザーに共有してください。</p>
          </div>
        ) : (
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
                <Label htmlFor="password">パスワード *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力または生成"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    生成
                  </Button>
                </div>
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
                <Label htmlFor="message">メモ（任意）</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ユーザーに関するメモや追加情報"
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
                ユーザー作成
              </Button>
            </DialogFooter>
          </form>
        )}

        {createdUser && (
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
