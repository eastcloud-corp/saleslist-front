// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Company Types
export interface Company {
  id: number
  name: string
  industry: string
  employee_count: number
  revenue: number
  prefecture: string
  city: string
  established_year: number
  website_url: string
  contact_email: string
  phone: string
  notes: string
  is_global_ng: boolean
  created_at: string
  updated_at: string
  executives?: Executive[]
}

export interface Executive {
  id: number
  name: string
  position: string
  facebook_url?: string
  other_sns_url?: string
  direct_email?: string
  notes?: string
  company_id?: number
}

// Client Types
export interface Client {
  id: number
  name: string
  contact_person?: string
  email?: string
  phone?: string
  industry?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  projects?: Project[]
  project_count?: number
  active_project_count?: number
}

// Project Types
export interface Project {
  id: number
  client_id: number
  client?: Client
  name: string
  client_company: string  // 後方互換性のため残す（廃止予定）
  description: string
  manager?: string
  target_industry?: string
  target_company_size?: string
  dm_template?: string
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled'
  start_date?: string
  end_date?: string
  assigned_user?: string
  created_at: string
  updated_at: string
  company_count?: number
}

export interface ProjectCompany {
  id: number
  project_id: number
  company_id: number
  company: Company
  status: string
  contact_date?: string
  notes?: string
  added_at: string
  updated_at: string
}

// NG Company Types
export interface NGCompany {
  id: number
  company_id: number
  project_id?: number
  reason: string
  is_global: boolean
  created_at: string
  created_by: string
}

// Filter Types
export interface CompanyFilter {
  search?: string
  industry?: string
  employee_min?: number
  employee_max?: number
  revenue_min?: number
  revenue_max?: number
  prefecture?: string
  established_year_min?: number
  established_year_max?: number
  has_facebook?: boolean
  exclude_ng?: boolean
  project_id?: number
  page?: number
  page_size?: number
  random_seed?: string
}

export interface SavedFilter {
  id: number
  name: string
  filter_conditions: CompanyFilter
  created_at: string
  updated_at: string
}

// Form Types
export interface CompanyFormData {
  name: string
  industry: string
  employee_count: number
  revenue: number
  prefecture: string
  city: string
  established_year: number
  website_url?: string
  contact_email?: string
  phone?: string
  notes?: string
}

export interface ProjectFormData {
  name: string
  client_company: string
  description: string
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled'
  assigned_user?: string
}

export interface ExecutiveFormData {
  name: string
  position: string
  facebook_url?: string
  other_sns_url?: string
  direct_email?: string
  notes?: string
}

// Status Types
export interface StatusOption {
  value: string
  label: string
  color?: string
}

// Master Data Types
export interface Industry {
  id: number
  name: string
  category?: string
}

export interface Prefecture {
  id: number
  name: string
  region: string
}

// CSV Types
export interface CSVImportResult {
  success: boolean
  imported_count: number
  error_count: number
  errors?: Array<{
    row: number
    field: string
    message: string
  }>
}

// Error Types
export interface ApiError {
  error: string
  message: string
  details?: Record<string, string[]>
}