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
export interface ApiResponse<T = unknown> {
  status: "success" | "error"
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

// API レスポンス用の統一インターフェース
export interface ApiListResponse<T> extends PaginatedResponse<T> {}

export interface ApiDetailResponse<T> {
  data: T
}

export interface ApiErrorResponse {
  error: string
  message?: string
}

// Client Types
export interface Client {
  id: number
  name: string // クライアント企業名
  contact_person?: string // 担当者名
  email?: string // 連絡先メール
  phone?: string // 連絡先電話
  industry?: string // クライアントの業界
  notes?: string // 備考
  is_active: boolean // アクティブ状態
  created_at: string // 作成日時
  updated_at: string // 更新日時

  // リレーション
  projects?: Project[] // 関連案件
  project_count?: number // 案件数（集計値）
  active_project_count?: number // 進行中案件数
}

// Company Types
export interface Company {
  id: number
  name: string
  corporate_number?: string
  industry: string
  
  // 担当者情報
  contact_person_name?: string
  contact_person_position?: string
  facebook_url?: string
  
  // 事業情報
  tob_toc_type?: string
  business_description?: string
  description?: string
  
  // 規模情報
  employee_count: number
  revenue: number
  capital?: number
  established_year: number
  
  // 所在地情報
  prefecture: string
  city: string
  location?: string
  
  // 連絡先情報
  website_url: string
  website?: string
  contact_email: string
  email?: string
  phone: string
  
  // システム管理
  notes: string
  status?: "active" | "prospect" | "inactive"
  is_global_ng: boolean
  created_at: string
  updated_at: string
  executives?: Executive[]

  // NG判定情報（追加）
  ng_status?: {
    is_ng: boolean
    types?: Array<"global" | "client" | "project">
    reasons?: {
      global?: string
      client?: { id: number; name: string; reason: string }
      project?: { id: number; name: string; reason: string }
    }
  }
}

export interface Executive {
  id: number
  name: string
  position: string
  facebook_url?: string
  other_sns_url?: string
  linkedin_url?: string
  twitter_url?: string
  email?: string
  phone?: string
  direct_email?: string
  notes?: string
  company_id?: number
}

// Project Types
export interface Project {
  id: number | string
  client_id?: number // クライアントID
  client?: Client // クライアント情報（リレーション）
  name: string
  client_company?: string
  client_name?: string
  description?: string
  manager?: string
  target_industry?: string
  target_company_size?: string
  status: "active" | "planning" | "in_progress" | "completed" | "cancelled" | "進行中" | "完了" | "中止" | "削除済み"
  start_date?: string // 契約開始日
  end_date?: string // 契約終了日
  assigned_user?: string
  created_at: string
  updated_at: string
  created_by?: string
  company_count?: number // 登録企業数
  contacted_count?: number // 接触済み企業数
  success_count?: number // 成約数
  companies?: ProjectCompany[] // 案件に紐づく企業リスト
  
  // 案件管理で使用する追加フィールド
  progress_status?: string // 進行状況
  progress_status_id?: number
  appointment_count?: number // アポ数
  approval_count?: number // 承認数
  reply_count?: number // 返信数
  friends_count?: number // 友達数
  director_login_available?: boolean // Dログイン可
  operator_group_invited?: boolean // 運用者招待
  situation?: string // 状況
  regular_meeting_date?: string // 定例会実施日
  list_import_source?: string // リスト輸入先
  entry_date_sales?: string // 記載日
  progress_tasks?: string // 進行タスク
  daily_tasks?: string // デイリータスク
  reply_check_notes?: string // 返信チェック
  remarks?: string // 備考
  complaints_requests?: string // クレームor要望
  director?: string // ディレクター
  operator?: string // 運用者
  sales_person?: string // 営業マン
  operation_start_date?: string // 運用開始日
  expected_end_date?: string // 終了予定日
  service_type?: string // サービス
  service_type_id?: number
  media_type?: string // 媒体
  media_type_id?: number
  regular_meeting_status?: string // 定例会ステータス
  regular_meeting_status_id?: number
  list_availability?: string // リスト有無
  list_availability_id?: number
  list_import_source_id?: number
}

export interface ProjectSnapshotOverview {
  name?: string
  client_name?: string
  progress_status?: string
  service_type?: string
  media_type?: string
  director?: string
  operator?: string
  sales_person?: string
  appointment_count?: number
  approval_count?: number
  reply_count?: number
  friends_count?: number
  expected_end_date?: string
  operation_start_date?: string
  situation?: string
  [key: string]: unknown
}

export interface ProjectSnapshot {
  id: number
  project: number
  created_at: string
  created_by: number | null
  created_by_name?: string | null
  reason?: string | null
  source: string
  source_label?: string | null
  changed_fields?: string[]
  project_overview?: ProjectSnapshotOverview
}

export interface ProjectCompany {
  id: number
  project_id: number
  company_id?: number
  company?: Company
  company_name?: string
  company_industry?: string
  status: "未接触" | "DM送信済み" | "返信あり" | "アポ獲得" | "成約" | "NG" | string
  contact_date?: string
  next_action?: string
  notes?: string
  staff_id?: number
  staff_name?: string
  follow_up_date?: string
  is_active?: boolean
  added_at: string
  updated_at: string
}

export interface BulkAddCompaniesResponse {
  message: string
  total_requested: number
  total_added: number
  missing_company_ids: number[]
  missing_project_ids: number[]
  projects: Array<{
    project_id: number
    project_name: string
    added_company_ids: number[]
    skipped: Array<{
      company_id: number
      company_name: string
      reason: string
    }>
  }>
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

export interface ClientNGCompany {
  id: number
  client_id: number
  company_name: string // NG企業名（部分一致用）
  company_id?: number // マッチした企業ID（NULL可）
  matched: boolean // マッチ状態
  reason?: string // NG理由
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NGImportResult {
  imported_count: number
  matched_count: number
  unmatched_count: number
  errors: string[]
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
  limit?: number
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
  status: "planning" | "in_progress" | "completed" | "cancelled"
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
