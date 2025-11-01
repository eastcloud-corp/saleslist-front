//\`\`\`tsx file="lib/auth.ts"
import { resolveApiBaseUrl } from "./api-base"
import type { User } from "./types"

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  mfa_required?: false
}

export interface LoginPendingResponse {
  mfa_required: true
  pending_auth_id: string
  email: string
  expires_in: number
  resend_interval: number
}

export type LoginResult = AuthResponse | LoginPendingResponse

export interface VerifyMfaPayload {
  pending_auth_id: string
  token: string
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

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    console.log("[v0] Login attempt with credentials:", { email: credentials.email })

    try {
      const baseUrl = resolveApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/v1/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      console.log("[v0] Login response status:", response.status)

      if (!response.ok) {
        console.log("[v0] Login failed - response not ok")
        throw new Error("ログインに失敗しました")
      }

      const data: any = await response.json()
      console.log("[v0] Login response data:", data)

      const mfaRequired =
        data?.mfa_required === true ||
        (typeof data === "object" && data !== null && "pending_auth_id" in data && Boolean(data.pending_auth_id))

      if (mfaRequired) {
        console.log("[v0] MFA required, returning pending challenge")
        return {
          mfa_required: true,
          pending_auth_id: data.pending_auth_id,
          email: data.email,
          expires_in: data.expires_in,
          resend_interval: data.resend_interval,
        }
      }

      if (data?.access_token && data?.refresh_token && data?.user) {
        console.log("[v0] Login successful, setting tokens")
        this.setTokens(data.access_token, data.refresh_token)
        return data as AuthResponse
      }

      console.log("[v0] Login failed - missing expected fields in response")
      throw new Error("ログインに失敗しました - 無効なレスポンス形式")
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw error
    }
  }

  async verifyMfa(payload: VerifyMfaPayload): Promise<AuthResponse> {
    console.log('[v0] Verifying MFA token', { pending_auth_id: payload.pending_auth_id })

    try {
      const baseUrl = resolveApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/v1/auth/mfa/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pending_auth_id: payload.pending_auth_id,
          token: payload.token,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ }))
        console.log('[v0] MFA verify failed - response not ok', errorData)
        throw new Error(errorData.error || '確認コードの検証に失敗しました')
      }

      const data: AuthResponse = await response.json()
      if (data?.access_token && data?.refresh_token && data?.user) {
        this.setTokens(data.access_token, data.refresh_token)
        console.log('[v0] MFA verification succeeded')
        return data
      }

      throw new Error('確認コードの検証に失敗しました - 無効なレスポンス形式')
    } catch (error) {
      console.error('[v0] MFA verify error:', error)
      throw error
    }
  }

  async resendMfa(pendingAuthId: string): Promise<void> {
    console.log('[v0] Resending MFA token', { pending_auth_id: pendingAuthId })

    try {
      const baseUrl = resolveApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/v1/auth/mfa/resend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pending_auth_id: pendingAuthId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ }))
        console.log('[v0] MFA resend failed - response not ok', errorData)
        throw new Error(errorData.error || '確認コードの再送に失敗しました')
      }
    } catch (error) {
      console.error('[v0] MFA resend error:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken()
      const baseUrl = resolveApiBaseUrl()
      await fetch(`${baseUrl}/api/v1/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
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

    const baseUrl = resolveApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    })

    if (!response.ok) {
      this.clearTokens()
      throw new Error("トークンの更新に失敗しました")
    }

    const data: any = await response.json()

    if (data.access_token) {
      this.accessToken = data.access_token
      if (typeof window !== "undefined" && this.accessToken) {
        localStorage.setItem("access_token", this.accessToken)
      }
      return this.accessToken || ""
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

  getRefreshToken(): string | null {
    return this.refreshToken
  }
}

export const authService = AuthService.getInstance()
