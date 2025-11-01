"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { resolveApiBaseUrl } from "@/lib/api-base"
import { authService } from "@/lib/auth"
import type { User } from "@/lib/types"

interface LoginMfaChallenge {
  pendingAuthId: string
  email: string
  expiresIn: number
  resendInterval: number
}

type LoginOutcome =
  | { status: "mfa_required"; challenge: LoginMfaChallenge }
  | { status: "authenticated"; user: User }

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginOutcome>
  verifyMfa: (pendingAuthId: string, token: string) => Promise<User>
  resendMfa: (pendingAuthId: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const normalizeUser = (apiUser: any): User => ({
  id: apiUser?.id?.toString() ?? "",
  email: apiUser?.email ?? "",
  name: apiUser?.name ?? "",
  role: apiUser?.role ?? "user",
  created_at: apiUser?.created_at ?? "",
  updated_at: apiUser?.updated_at ?? "",
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const redirectToLogin = () => {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setUser(null)
          redirectToLogin()
          return
        }

        const response = await fetch(`${resolveApiBaseUrl()}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${authService.getAccessToken()}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(normalizeUser(userData))
        } else {
          await authService.logout()
          setUser(null)
          redirectToLogin()
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        await authService.logout()
        setUser(null)
        redirectToLogin()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<LoginOutcome> => {
    console.log("[v0] useAuth login called with email:", email)
    setIsLoading(true)
    try {
      const result = await authService.login({ email, password })

      if ('mfa_required' in result && result.mfa_required) {
        return {
          status: 'mfa_required',
          challenge: {
            pendingAuthId: result.pending_auth_id,
            email: result.email,
            expiresIn: result.expires_in,
            resendInterval: result.resend_interval,
          },
        }
      }

      if ('user' in result) {
        console.log("[v0] Login successful, setting user:", result.user)
        const normalized = normalizeUser(result.user)
        setUser(normalized)
        return { status: 'authenticated', user: normalized }
      }

      throw new Error("想定しないレスポンス形式です")
    } catch (error) {
      console.error("[v0] Login error in useAuth:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyMfa = async (pendingAuthId: string, token: string): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authService.verifyMfa({ pending_auth_id: pendingAuthId, token })
      const normalized = normalizeUser(response.user)
      setUser(normalized)
      return normalized
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resendMfa = async (pendingAuthId: string): Promise<void> => {
    try {
      await authService.resendMfa(pendingAuthId)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    if (!authService.isAuthenticated()) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    verifyMfa,
    resendMfa,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
