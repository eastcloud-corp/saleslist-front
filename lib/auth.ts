//\`\`\`tsx file="lib/auth.ts"
import { apiClient, API_CONFIG } from "./api-config"
import type { User, ApiResponse } from "./types"

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}

class AuthService {
  private static instance: AuthService
  private accessToken: string | null = null
  private refreshToken: string | null = null

  private constructor() {
    // Initialize tokens from localStorage if available
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token")
      this.refreshToken = localStorage.getItem("refresh_token")
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("[v0] Login attempt with credentials:", { email: credentials.email })

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, credentials)
      console.log("[v0] Login response status:", response.status)

      if (!response.ok) {
        console.log("[v0] Login failed - response not ok")
        throw new Error("ログインに失敗しました")
      }

      const data: AuthResponse = await response.json()
      console.log("[v0] Login response data:", data)

      if (data.access_token && data.refresh_token) {
        console.log("[v0] Login successful, setting tokens")
        this.setTokens(data.access_token, data.refresh_token)
        return data
      }

      console.log("[v0] Login failed - missing tokens in response")
      throw new Error("ログインに失敗しました - 無効なレスポンス形式")
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(
        API_CONFIG.ENDPOINTS.LOGOUT,
        {},
        {
          headers: this.getAuthHeaders(),
        },
      )
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      this.clearTokens()
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error("リフレッシュトークンが利用できません")
    }

    const response = await apiClient.post(API_CONFIG.ENDPOINTS.REFRESH, {
      refresh_token: this.refreshToken,
    })

    if (!response.ok) {
      this.clearTokens()
      throw new Error("トークンの更新に失敗しました")
    }

    const data: ApiResponse<{ access_token: string }> = await response.json()

    if (data.status === "success") {
      this.accessToken = data.data.access_token
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", this.accessToken)
      }
      return this.accessToken
    }

    throw new Error("トークンの更新に失敗しました")
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken)
      localStorage.setItem("refresh_token", refreshToken)
    }
  }

  private clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  getAuthHeaders(): Record<string, string> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getAccessToken(): string | null {
    return this.accessToken
  }
}

export const authService = AuthService.getInstance()
