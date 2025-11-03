"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Info, RefreshCw } from "lucide-react"

interface MfaChallenge {
  pendingAuthId: string
  email: string
  expiresIn: number
  resendInterval: number
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const { login, verifyMfa, resendMfa } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!challenge || resendCooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [challenge, resendCooldown])

  // Environment-based configuration
  const inferredEnvironment = process.env.NODE_ENV === 'production' ? 'prd' : 'dev'
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || inferredEnvironment
  const normalizedEnvironment = environment ? environment.toLowerCase() : ''
  const isProductionLike = ['prd', 'prod', 'production'].includes(normalizedEnvironment)
  const isStaging = normalizedEnvironment === 'stg'
  const showDebugInfo = process.env.NODE_ENV !== 'production' && !isProductionLike

  const getEnvironmentBadge = () => {
    if (isProductionLike) {
      return { label: '本番', variant: 'destructive' as const }
    }
    if (isStaging) {
      return { label: 'ステージング', variant: 'secondary' as const }
    }
    return { label: '開発', variant: 'default' as const }
  }

  const debugAccounts = [
    {
      label: "一般ユーザー",
      email: process.env.NEXT_PUBLIC_DEBUG_EMAIL ?? "user@example.com",
      password: process.env.NEXT_PUBLIC_DEBUG_PASSWORD ?? "password123",
    },
    {
      label: "管理者ユーザー",
      email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "reviewer@example.com",
      password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "password123",
    },
  ]

  const handleDebugLogin = (debugEmail: string, debugPassword: string) => {
    setEmail(debugEmail)
    setPassword(debugPassword)
  }

  const resetMessages = () => {
    setError("")
    setInfo("")
  }

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const result = await login(email, password)
      console.log("[login-form] login result", result)

      if (result.status === 'mfa_required') {
        const pendingChallenge: MfaChallenge = result.challenge
        setChallenge(pendingChallenge)
        setToken("")
        setResendCooldown(pendingChallenge.resendInterval)
        setInfo(`${pendingChallenge.email} に確認コードを送信しました。`)
        return
      }

      router.push("/companies")
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else {
        setError("メールアドレスまたはパスワードが正しくありません。再度お試しください。")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge) return
    resetMessages()
    setIsVerifying(true)

    try {
      await verifyMfa(challenge.pendingAuthId, token)
      router.push("/companies")
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else {
        setError("確認コードの検証に失敗しました。再度お試しください。")
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!challenge || resendCooldown > 0) return
    resetMessages()
    setIsResending(true)

    try {
      await resendMfa(challenge.pendingAuthId)
      setResendCooldown(challenge.resendInterval)
      setInfo("確認コードを再送しました。数分お待ちのうえ受信ボックスをご確認ください。")
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else {
        setError("確認コードの再送に失敗しました。時間をおいて再度お試しください。")
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToLogin = () => {
    setChallenge(null)
    setToken("")
    resetMessages()
  }

  const badgeConfig = getEnvironmentBadge()
  const shouldShowBadge = !isProductionLike

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Environment Badge - Top Right (非本番のみ表示) */}
      {shouldShowBadge && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant={badgeConfig.variant} className="text-sm font-medium">
            {badgeConfig.label}環境
          </Badge>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ソーシャルナビゲーター</CardTitle>
          <CardDescription className="text-center">
            {challenge
              ? `${challenge.email} に送信した確認コードを入力してください`
              : "アカウントにアクセスするには認証情報を入力してください"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {challenge ? (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">確認コード</Label>
                <Input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="6桁の確認コード"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  disabled={isVerifying}
                />
                <p className="text-xs text-muted-foreground">有効期限: 約 {Math.floor(challenge.expiresIn / 60)} 分</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {info && !error && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isVerifying || token.length !== 6}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    確認中...
                  </>
                ) : (
                  "確認する"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                disabled={isResending || resendCooldown > 0}
                onClick={handleResend}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    再送中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    確認コードを再送する
                    {resendCooldown > 0 && <span className="text-xs text-muted-foreground">({resendCooldown}秒後に再度送信可能)</span>}
                  </>
                )}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={handleBackToLogin} disabled={isVerifying || isResending}>
                別のアカウントでログインする
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
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

              {info && !error && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{info}</AlertDescription>
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
          )}

          {/* Development Debug Information */}
          {!challenge && showDebugInfo && (
            <div className="mt-6 space-y-3">
              <div className="border-t pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">開発環境用ログイン情報</p>
                      <div className="space-y-3">
                        {debugAccounts.map((account) => (
                          <div key={account.label} className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{account.label}</p>
                              <Badge variant={account.label.includes("管理者") ? "default" : "secondary"} className="text-[10px]">
                                {account.label.includes("管理者") ? "Admin" : "User"}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p><span className="font-medium">Email:</span> {account.email}</p>
                              <p><span className="font-medium">Password:</span> {account.password}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDebugLogin(account.email, account.password)}
                              className="w-full"
                            >
                              この情報を入力
                            </Button>
                          </div>
                        ))}
                      </div>
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
