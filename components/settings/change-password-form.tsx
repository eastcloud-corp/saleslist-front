"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-config"
import { Lock } from "lucide-react"

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (newPassword.length < 8) {
      setFieldErrors({ new_password: "新しいパスワードは8文字以上にしてください。" })
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setFieldErrors({ new_password_confirm: "新しいパスワード（確認）が一致しません。" })
      return
    }

    setSubmitting(true)
    try {
      const response = await apiClient.post("/auth/password/change/", {
        current_password: currentPassword,
        new_password: newPassword,
      })
      if (response.ok) {
        setCurrentPassword("")
        setNewPassword("")
        setNewPasswordConfirm("")
        toast({ title: "完了", description: "パスワードを変更しました。" })
      } else {
        const data = await response.json().catch(() => ({}))
        const errors: Record<string, string> = {}
        if (Array.isArray(data.current_password)) errors.current_password = data.current_password[0]
        else if (data.current_password) errors.current_password = data.current_password
        if (Array.isArray(data.new_password)) errors.new_password = data.new_password[0]
        else if (data.new_password) errors.new_password = data.new_password
        if (data.error) errors._form = data.error
        setFieldErrors(errors)
        toast({
          title: "エラー",
          description: errors._form ?? errors.current_password ?? errors.new_password ?? "パスワードの変更に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "パスワードの変更に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          パスワード変更
        </CardTitle>
        <CardDescription>ログインに使用しているパスワードを変更します</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {fieldErrors._form && (
            <p className="text-sm text-destructive">{fieldErrors._form}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="current-password">現在のパスワード</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワードを入力"
              required
              className={fieldErrors.current_password ? "border-destructive" : ""}
            />
            {fieldErrors.current_password && (
              <p className="text-sm text-destructive">{fieldErrors.current_password}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">新しいパスワード</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8文字以上"
              required
              minLength={8}
              className={fieldErrors.new_password ? "border-destructive" : ""}
            />
            {fieldErrors.new_password && (
              <p className="text-sm text-destructive">{fieldErrors.new_password}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password-confirm">新しいパスワード（確認）</Label>
            <Input
              id="new-password-confirm"
              type="password"
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="もう一度入力"
              required
              minLength={8}
              className={fieldErrors.new_password_confirm ? "border-destructive" : ""}
            />
            {fieldErrors.new_password_confirm && (
              <p className="text-sm text-destructive">{fieldErrors.new_password_confirm}</p>
            )}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "変更中..." : "パスワードを変更"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
