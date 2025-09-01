export const API_CONFIG = {
  BASE_URL: "https://sales-navigator.east-cloud.jp/api/v1",
  ENDPOINTS: {
    // Authentication
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout", 
    REFRESH: "/auth/refresh",

    // Companies
    COMPANIES: "/companies",
    COMPANY_DETAIL: (id: string) => `/companies/${id}`,
    COMPANY_SEARCH: "/companies/search",
    COMPANY_EXPORT: "/companies/export",
    COMPANY_IMPORT: "/companies/import",
    COMPANY_BULK_IMPORT: "/companies/bulk-import",

    // Projects
    PROJECTS: "/projects",
    PROJECT_DETAIL: (id: string) => `/projects/${id}`,
    PROJECT_COMPANIES: (id: string) => `/projects/${id}/companies`,

    // NG Companies
    NG_COMPANIES: "/ng-companies",
    NG_COMPANY_GLOBAL: "/ng-companies/global",
    NG_COMPANY_PROJECT: (projectId: string) => `/ng-companies/project/${projectId}`,

    // Executives
    EXECUTIVES: "/executives",
    EXECUTIVE_DETAIL: (id: string) => `/executives/${id}`,

    // Filters
    SAVED_FILTERS: "/saved-filters",
    FILTER_DETAIL: (id: string) => `/saved-filters/${id}`,
  },
} as const