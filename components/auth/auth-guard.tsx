"use client"

import { useAuth } from "@/hooks/use-auth"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: 'admin' | 'user'
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireRole,
  fallback 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push('/login')
    }
    
    if (!isLoading && requireRole && user?.role !== requireRole) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, user, requireAuth, requireRole, router])

  // ローディング中
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  // 認証が必要だが未認証
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">ログインが必要です...</p>
        </div>
      </div>
    )
  }

  // 特定の権限が必要だが不足
  if (requireRole && user?.role !== requireRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">この機能にアクセスする権限がありません</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}