import { resolveApiBaseUrl } from "./api-base"
import { API_CONFIG } from "./api-config"

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
    public data?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  private retryCount = 0
  private maxRetries = 0  // Disable retries for mock server
  private isRefreshingToken = false
  private refreshPromise: Promise<void> | null = null
  private isHandlingUnauthorized = false

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("access_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async refreshToken(): Promise<void> {
    // Skip token refresh for mock server
    return Promise.resolve()
  }

  private clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  private async handleResponse<T>(response: Response, endpoint: string, options?: any): Promise<T> {
    // Skip retry logic for mock server
    return this.processResponse<T>(response)
  }

  private async processResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      await this.handleUnauthorized(response.status)
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorData: unknown = null

      try {
        const rawBody = await response.text()
        if (rawBody) {
          try {
            const parsed = JSON.parse(rawBody)
            errorData = parsed
            if (parsed && typeof parsed === "object") {
              const candidate = (parsed as Record<string, unknown>).message || (parsed as Record<string, unknown>).error
              if (typeof candidate === "string" && candidate.trim().length > 0) {
                errorMessage = candidate
              }
            }
          } catch {
            errorData = { raw: rawBody }
          }
        }
      } catch {
        // ignore body parse errors
      }

      throw new ApiError(errorMessage, response.status, response, errorData)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    }

    return response.text() as unknown as T
  }

  private async handleUnauthorized(status: number) {
    if (status !== 401 && status !== 403) return
    if (typeof window === "undefined") return
    if (this.isHandlingUnauthorized) return
    this.isHandlingUnauthorized = true

    try {
      const { authService } = await import("./auth")
      await authService.logout()
    } catch (error) {
      console.error("[api-client] failed to handle unauthorized response", error)
    } finally {
      try {
        window.location.href = "/login"
      } finally {
        this.isHandlingUnauthorized = false
      }
    }
  }

  private buildUrl(endpoint: string): string {
    const baseUrl = `${resolveApiBaseUrl()}/api/v1`
    return `${baseUrl}${endpoint}`
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    return fetch(this.buildUrl(endpoint), {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(),
      },
    })
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const requestOptions: RequestInit = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    }

    const response = await this.makeRequest(endpoint, requestOptions)
    return this.handleResponse<T>(response, endpoint, requestOptions)
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }

    const response = await this.makeRequest(endpoint, requestOptions)
    return this.handleResponse<T>(response, endpoint, requestOptions)
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const requestOptions: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }

    const response = await this.makeRequest(endpoint, requestOptions)
    return this.handleResponse<T>(response, endpoint, requestOptions)
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const requestOptions: RequestInit = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }

    const response = await this.makeRequest(endpoint, requestOptions)
    return this.handleResponse<T>(response, endpoint, requestOptions)
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    }

    const response = await this.makeRequest(endpoint, requestOptions)
    return this.handleResponse<T>(response, endpoint, requestOptions)
  }

  // File upload method
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData()
    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const requestOptions: RequestInit = {
      method: "POST",
      // Don't set Content-Type for FormData, let browser set it with boundary
      body: formData,
    }

    const response = await this.makeRequest(endpoint, requestOptions)
    return this.handleResponse<T>(response, endpoint, requestOptions)
  }

  // Download file method
  async downloadFile(endpoint: string): Promise<Blob> {
    const response = await this.makeRequest(endpoint, {
      method: "GET",
    })

    if (!response.ok) {
      throw new ApiError(
        `Failed to download file: ${response.statusText}`,
        response.status,
        response
      )
    }

    return response.blob()
  }
}

export const apiClient = new ApiClient()
export { ApiClient, ApiError }
