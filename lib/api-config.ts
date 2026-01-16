import { resolveApiBaseUrl } from "./api-base"

const normalizedBaseUrl = (): string => {
  const base = resolveApiBaseUrl().replace(/\/+$/, "")
  return `${base}/api/v1`
}

export const API_CONFIG = {
  get BASE_URL() {
    return normalizedBaseUrl()
  },
  ENDPOINTS: {
    // Authentication
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    REGISTER: "/auth/register",

    // Clients
    CLIENTS: "/clients/",
    CLIENT_DETAIL: (id: string) => `/clients/${id}/`,
    CLIENT_EXPORT_COMPANIES: (id: string | number) => `/clients/${id}/export-companies/`,

    // Companies
    COMPANIES: "/companies/",
    COMPANY_DETAIL: (id: string) => `/companies/${id}/`,
    COMPANY_SEARCH: "/companies/search/",
    COMPANY_EXPORT: "/companies/export/",
    COMPANY_IMPORT_CSV: "/companies/import_csv/",
    COMPANY_IMPORT: "/companies/import/",
    COMPANY_BULK_IMPORT: "/companies/bulk-import/",
    COMPANY_BULK_ADD_TO_PROJECTS: "/companies/bulk-add-to-projects/",
    COMPANY_REVIEW_BATCHES: "/companies/reviews/",
    COMPANY_REVIEW_BATCH_DETAIL: (id: string | number) => `/companies/reviews/${id}/`,
    COMPANY_REVIEW_DECIDE: (id: string | number) => `/companies/reviews/${id}/decide/`,
    COMPANY_REVIEW_BULK_DECIDE: "/companies/reviews/bulk-decide/",
    COMPANY_REVIEW_RUN_CORPORATE_IMPORT: "/companies/reviews/run-corporate-number-import/",
    COMPANY_REVIEW_RUN_OPENDATA_INGESTION: "/companies/reviews/run-opendata-ingestion/",

    // Projects
    PROJECTS: "/projects/",
    PROJECT_DETAIL: (id: string) => `/projects/${id}/`,
    PROJECT_COMPANIES: (id: string) => `/projects/${id}/companies/`,
    PROJECT_IMPORT: "/projects/import_csv/",
    PROJECT_EXPORT: (id: string) => `/projects/${id}/export_csv/`,
    PROJECT_BULK_PARTIAL_UPDATE: "/projects/bulk-partial-update",
    PROJECT_PAGE_LOCK: "/projects/page-lock/",
    PROJECT_PAGE_UNLOCK: "/projects/page-unlock/",
    PROJECT_SNAPSHOTS: (id: string) => `/projects/${id}/snapshots/`,
    PROJECT_SNAPSHOT_RESTORE: (projectId: string, snapshotId: string) =>
      `/projects/${projectId}/snapshots/${snapshotId}/restore/`,

    // NG Companies
    NG_COMPANIES: "/ng-companies/",
    NG_COMPANY_GLOBAL: "/ng-companies/global/",
    NG_COMPANY_PROJECT: (projectId: string) => `/ng-companies/project/${projectId}/`,
    NG_COMPANY_IMPORT: (clientId: string) => `/clients/${clientId}/ng-companies/import`,
    NG_COMPANY_TEMPLATE: "/ng-companies/template/",

    // Data Collection
    DATA_COLLECTION_RUNS: "/data-collection/runs/",
    DATA_COLLECTION_TRIGGER: "/data-collection/trigger",

    // Executives
    EXECUTIVES: "/executives/",
    EXECUTIVE_DETAIL: (id: string) => `/executives/${id}/`,
    EXECUTIVE_IMPORT: "/executives/import_csv/",
    EXECUTIVE_EXPORT: "/executives/export_csv/",

    // Filters
    SAVED_FILTERS: "/saved-filters/",
    FILTER_DETAIL: (id: string) => `/saved-filters/${id}/`,

    // Dashboard
    DASHBOARD_STATS: "/dashboard/stats/",
    DASHBOARD_RECENT_PROJECTS: "/dashboard/recent-projects/",
    DASHBOARD_RECENT_COMPANIES: "/dashboard/recent-companies/",

    // Masters
    MASTER_INDUSTRIES: "/master/industries/",
    MASTER_STATUSES: "/master/statuses/",
    MASTER_PREFECTURES: "/master/prefectures/",
  },
} as const

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  private isHandlingUnauthorized = false

  private async handleUnauthorized(status: number) {
    if (status !== 401 && status !== 403) return
    if (typeof window === "undefined") return
    if (this.isHandlingUnauthorized) return

    this.isHandlingUnauthorized = true
    try {
      const { authService } = await import("./auth")
      await authService.logout()
    } catch (error) {
      console.error("[api-config] failed to handle unauthorized response", error)
    } finally {
      try {
        window.location.href = "/login"
      } finally {
        this.isHandlingUnauthorized = false
      }
    }
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("access_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private buildUrl(endpoint: string): string {
    const base = API_CONFIG.BASE_URL.replace(/\/+$/, "")
    const path = endpoint.replace(/^\/+/, "")
    return `${base}/${path}`
  }

  async get(endpoint: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    })
    await this.handleUnauthorized(response.status)
    return response
  }

  async post(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    await this.handleUnauthorized(response.status)
    return response
  }

  async put(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    await this.handleUnauthorized(response.status)
    return response
  }

  async patch(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    await this.handleUnauthorized(response.status)
    return response
  }

  async delete(endpoint: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    })
    await this.handleUnauthorized(response.status)
    return response
  }

  // File upload method
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<Response> {
    const formData = new FormData()
    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const response = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    })
    await this.handleUnauthorized(response.status)

    return response
  }

  async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // If response is not JSON, use default error message
      }

      throw new ApiError(errorMessage, response.status, response)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    }

    return response.text() as unknown as T
  }
}

export const apiClient = new ApiClient()
export { ApiError }
