"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Info } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  // Environment-based configuration
  const inferredEnvironment = process.env.NODE_ENV === 'production' ? 'prd' : 'dev'
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || inferredEnvironment
  const showDebugInfo = !['prd', 'stg'].includes(environment)

  const getEnvironmentBadge = () => {
    switch (environment) {
      case 'prd':
        return { label: '本番', variant: 'destructive' as const }
      case 'stg':
        return { label: 'ステージング', variant: 'secondary' as const }
      case 'dev':
      default:
        return { label: '開発', variant: 'default' as const }
    }
  }

  const debugCredentials = {
    email: 'test@dev.com',
    password: 'dev123'
  }

  const handleDebugLogin = () => {
    setEmail(debugCredentials.email)
    setPassword(debugCredentials.password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await login(email, password)
      router.push("/companies")
    } catch (err) {
      setError("メールアドレスまたはパスワードが正しくありません。再度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  const badgeConfig = getEnvironmentBadge()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Environment Badge - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Badge variant={badgeConfig.variant} className="text-sm font-medium">
          {badgeConfig.label}環境
        </Badge>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ソーシャルナビゲーター</CardTitle>
          <CardDescription className="text-center">
            アカウントにアクセスするには認証情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="メールアドレスを入力"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>

          {/* Development Debug Information */}
          {showDebugInfo && (
            <div className="mt-6 space-y-3">
              <div className="border-t pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">開発環境用ログイン情報</p>
                      <div className="text-xs space-y-1">
                        <p><span className="font-medium">Email:</span> {debugCredentials.email}</p>
                        <p><span className="font-medium">Password:</span> {debugCredentials.password}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDebugLogin}
                        className="w-full mt-2"
                      >
                        デバッグ情報を自動入力
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
