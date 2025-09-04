export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1",
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

    // Companies
    COMPANIES: "/companies/",
    COMPANY_DETAIL: (id: string) => `/companies/${id}/`,
    COMPANY_SEARCH: "/companies/search/",
    COMPANY_EXPORT: "/companies/export/",
    COMPANY_IMPORT: "/companies/import/",
    COMPANY_BULK_IMPORT: "/companies/bulk-import/",

    // Projects
    PROJECTS: "/projects/",
    PROJECT_DETAIL: (id: string) => `/projects/${id}/`,
    PROJECT_COMPANIES: (id: string) => `/projects/${id}/companies/`,

    // NG Companies
    NG_COMPANIES: "/ng-companies/",
    NG_COMPANY_GLOBAL: "/ng-companies/global/",
    NG_COMPANY_PROJECT: (projectId: string) => `/ng-companies/project/${projectId}/`,

    // Executives
    EXECUTIVES: "/executives/",
    EXECUTIVE_DETAIL: (id: string) => `/executives/${id}/`,

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
  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("access_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
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
