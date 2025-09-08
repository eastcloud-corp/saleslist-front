"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authService } from "@/lib/auth"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Django API でユーザー情報取得
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${authService.getAccessToken()}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser({
              id: userData.id.toString(),
              email: userData.email,
              name: userData.name,
              role: userData.role,
              created_at: userData.created_at,
              updated_at: userData.updated_at,
            })
          } else {
            // トークンが無効な場合はログアウト
            await authService.logout()
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        await authService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    console.log("[v0] useAuth login called with email:", email)
    setIsLoading(true)
    try {
      const authResponse = await authService.login({ email, password })
      console.log("[v0] Login successful, setting user:", authResponse.user)
      setUser(authResponse.user)
    } catch (error) {
      console.error("[v0] Login error in useAuth:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (!authService.isAuthenticated()) { setIsLoading(false); return; }
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
