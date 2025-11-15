import type { Company } from "./types"

export interface CSVCompanyData {
  name: string
  corporate_number?: string
  industry: string
  employee_count?: string
  revenue?: string
  location?: string
  prefecture?: string
  city?: string
  website?: string
  website_url?: string
  phone?: string
  email?: string
  contact_email?: string
  description?: string
  business_description?: string
  status?: string
  contact_person_name?: string
  contact_person_position?: string
  facebook_url?: string
  tob_toc_type?: string
  capital?: string
  established_year?: string
  notes?: string
}

export const CSV_HEADERS = [
  "name",
  "contact_person_name",
  "contact_person_position",
  "facebook_url",
  "industry",
  "employee_count",
  "revenue",
  "prefecture",
  "website",
  "phone",
  "email",
  "description",
  "status",
] as const

export const CSV_HEADER_LABELS = {
  name: "企業名",
  contact_person_name: "担当者名",
  contact_person_position: "担当者役職",
  facebook_url: "Facebook",
  industry: "業界",
  employee_count: "従業員数",
  revenue: "売上",
  prefecture: "所在地",
  website: "Webサイト",
  phone: "電話番号",
  email: "メールアドレス",
  description: "備考",
  status: "ステータス",
} as const

export const CSV_FIELD_DISPLAY_NAMES: Record<string, string> = {
  name: "企業名",
  corporate_number: "法人番号",
  industry: "業種",
  employee_count: "従業員数",
  revenue: "売上（円）",
  location: "所在地",
  prefecture: "都道府県",
  city: "市区町村",
  website: "WebサイトURL",
  website_url: "WebサイトURL",
  phone: "電話番号",
  email: "メールアドレス",
  contact_email: "メールアドレス",
  description: "備考",
  business_description: "事業内容",
  status: "ステータス",
  contact_person_name: "担当者名",
  contact_person_position: "担当者役職",
  facebook_url: "Facebookリンク",
  tob_toc_type: "toB/toC区分",
  capital: "資本金",
  established_year: "設立年",
  notes: "備考",
}

export function exportCompaniesToCSV(companies: Company[]): string {
  const headers = CSV_HEADERS.map((header) => CSV_HEADER_LABELS[header]).join(",")

  const rows = companies.map((company) => {
    return CSV_HEADERS.map((header) => {
      let value: string = ""
      
      // フィールドマッピング
      if (header === "website") {
        value = company.website_url || company.website || ""
      } else if (header === "email") {
        value = company.contact_email || company.email || ""
      } else {
        value = company[header as keyof Company]?.toString() || ""
      }

      // Handle special formatting
      if (header === "employee_count" || header === "revenue") {
        value = value.toString()
      }

      // Escape commas and quotes in CSV
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        value = `"${value.replace(/"/g, '""')}"`
      }

      return value
    }).join(",")
  })

  return [headers, ...rows].join("\n")
}

export function downloadCSV(csvContent: string, filename: string): void {
  // BOMを追加してExcelで正しく日本語を表示
  const bom = "\ufeff"
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function parseCSV(csvText: string): CSVCompanyData[] {
  const rows = parseCSVRows(csvText)

  if (rows.length < 2) {
    throw new Error("CSVファイルにはヘッダー行と1件以上のデータ行が必要です。")
  }

  const headersRaw = rows[0].map((h) => h.trim().replace(/"/g, ""))
  const headerMap = headersRaw.map((header) => normalizeHeader(header))

  const recognizedHeaders = new Set(headerMap.filter(Boolean))
  if (!recognizedHeaders.has("name")) {
    throw new Error('企業名に対応するヘッダーが見つかりません。"name" または "会社名" 列を追加してください。')
  }

  const emptyRow = (row: string[]) => row.every((value) => !value || value.trim().length === 0)

  return rows.slice(1).reduce<CSVCompanyData[]>((acc, values, index) => {
    const rowNumber = index + 2
    if (values.length === 1 && values[0] === "") {
      return acc
    }

    if (values.length !== headersRaw.length) {
      if (emptyRow(values)) {
        return acc
      }
      throw new Error(`${rowNumber}行目: 列数が一致しません（期待: ${headersRaw.length}列 / 実際: ${values.length}列）`)
    }

    const record: CSVCompanyData = {
      name: "",
      corporate_number: "",
      industry: "",
      employee_count: "",
      revenue: "",
      location: "",
      prefecture: "",
      city: "",
      website: "",
      website_url: "",
      phone: "",
      email: "",
      contact_email: "",
      description: "",
      business_description: "",
      status: "",
      contact_person_name: "",
      contact_person_position: "",
      facebook_url: "",
      tob_toc_type: "",
      capital: "",
      established_year: "",
      notes: "",
    }

    headersRaw.forEach((originalHeader, i) => {
      const key = headerMap[i]
      if (!key) return
      const value = values[i]?.trim() ?? ""
      switch (key) {
        case "name":
        case "industry":
        case "corporate_number":
        case "employee_count":
        case "revenue":
        case "location":
        case "prefecture":
        case "city":
        case "phone":
        case "status":
          ;(record as unknown as Record<string, string | undefined>)[key] = value
          break
        case "website":
        case "website_url":
          record.website = value
          record.website_url = value
          break
        case "email":
        case "contact_email":
          record.email = value
          record.contact_email = value
          break
        case "business_description":
          record.business_description = value
          record.description = value
          break
        case "description":
          record.description = value
          break
        default:
          ;(record as unknown as Record<string, string | undefined>)[key] = value
      }
    })

    if (emptyRow(Object.values(record))) {
      return acc
    }

    acc.push(record)
    return acc
  }, [])
}

function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = []
  let currentField = ""
  let currentRow: string[] = []
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField)
      currentField = ""
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField)
        rows.push(currentRow)
        currentRow = []
        currentField = ""
      }
      if (char === '\r' && nextChar === '\n') {
        i++
      }
    } else if (char === '\r') {
      continue
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  return rows
}

function normalizeHeader(header: string): string {
  const directMap: Record<string, string> = {
    名前: "contact_person_name",
    担当者名: "contact_person_name",
    役職: "contact_person_position",
    Facebookリンク: "facebook_url",
    'toB toC': "tob_toc_type",
    資本金: "capital",
    設立年: "established_year",
    アポ実績: "notes",
    会社名: "name",
    企業名: "name",
    業種: "industry",
    "従業員数(あれば)": "employee_count",
    従業員数: "employee_count",
    "売上規模(あれば)": "revenue",
    売上規模: "revenue",
    "Revenue (¥)": "revenue",
    "所在地(都道府県)": "prefecture",
    都道府県: "prefecture",
    所在地: "location",
    市区町村: "city",
    会社HP: "website_url",
    HP: "website_url",
    メールアドレス: "contact_email",
    電話番号: "phone",
    事業内容: "business_description",
    備考: "description",
    法人番号: "corporate_number",
  }

  if (directMap[header]) {
    return directMap[header]
  }

  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "_")
  const headerMap: Record<string, string> = {
    company_name: "name",
    company: "name",
    name: "name",
    contact_person_name: "contact_person_name",
    contact_name: "contact_person_name",
    contact_person_position: "contact_person_position",
    facebook_url: "facebook_url",
    tob_toc_type: "tob_toc_type",
    capital: "capital",
    established_year: "established_year",
    notes: "notes",
    industry: "industry",
    employee_count: "employee_count",
    employees: "employee_count",
    staff_count: "employee_count",
    revenue: "revenue",
    annual_revenue: "revenue",
    sales: "revenue",
    prefecture: "prefecture",
    city: "city",
    location: "location",
    address: "location",
    website_url: "website_url",
    website: "website",
    url: "website",
    phone: "phone",
    telephone: "phone",
    tel: "phone",
    email: "contact_email",
    e_mail: "contact_email",
    description: "description",
    business_description: "business_description",
    status: "status",
    state: "status",
    corporate_number: "corporate_number",
    corporate_no: "corporate_number",
    corporateid: "corporate_number",
    corporateidnumber: "corporate_number",
  }

  return headerMap[normalized] || normalized
}

export interface CSVValidationError {
  row: number
  field: string
  value: string
  message: string
}

export function validateCSVData(data: CSVCompanyData[]): CSVValidationError[] {
  const errors: CSVValidationError[] = []

  const getFieldLabel = (field: string): string => CSV_FIELD_DISPLAY_NAMES[field] || field

  data.forEach((row, index) => {
    const rowNumber = index + 2 // Account for header row

    const addError = (field: keyof CSVCompanyData | string, value: unknown, detail: string) => {
      const label = getFieldLabel(field as string)
      errors.push({
        row: rowNumber,
        field: field as string,
        value: value === undefined || value === null ? "" : String(value),
        message: `「${label}」列: ${detail}`,
      })
    }

    // Validate employee count
    if (row.employee_count && isNaN(Number(row.employee_count))) {
      addError("employee_count", row.employee_count, "数値で入力してください")
    }

    // Validate revenue
    if (row.revenue && isNaN(Number(row.revenue))) {
      addError("revenue", row.revenue, "数値で入力してください")
    }

    // Validate email format
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      addError("email", row.email, "メールアドレスの形式が正しくありません")
    }

    // Validate website format
    if (row.website && row.website.trim() && !/^https?:\/\/.+/.test(row.website)) {
      addError("website", row.website, "http:// または https:// から始まるURLを入力してください")
    }

    if (row.facebook_url && row.facebook_url.trim() && !/^https?:\/\/.+/.test(row.facebook_url)) {
      addError("facebook_url", row.facebook_url, "http:// または https:// から始まるURLを入力してください")
    }

    // Validate status
    const validStatuses = ["active", "prospect", "inactive"]
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
      addError(
        "status",
        row.status,
        `次のいずれかの値を指定してください: ${validStatuses.join(", ")}`,
      )
    }

    if (row.capital && isNaN(Number(row.capital))) {
      addError("capital", row.capital, "数値で入力してください")
    }

    if (row.established_year && isNaN(Number(row.established_year))) {
      addError("established_year", row.established_year, "数値で入力してください")
    }

    if (row.tob_toc_type) {
      const normalized = row.tob_toc_type.trim().toUpperCase()
      const allowed = new Set(["TOB", "TOC", "B", "C", "BOTH", "B2B", "B2C", "B2B2C", "B&C", "B/C"])
      if (!allowed.has(normalized)) {
        addError("tob_toc_type", row.tob_toc_type, "toB、toC、Bothなどの区分を入力してください")
      }
    }

    if (row.corporate_number && row.corporate_number.trim().length > 0) {
      const sanitizedCorporateNumber = row.corporate_number.replace(/[^0-9]/g, "")
      if (!/^\d{13}$/.test(sanitizedCorporateNumber)) {
        addError(
          "corporate_number",
          row.corporate_number,
          "法人番号はハイフンを除いた13桁の数字で入力してください",
        )
      }
    }
  })

  return errors
}

export function convertCSVToCompanyData(
  csvData: CSVCompanyData[],
): Omit<Company, "id" | "created_at" | "updated_at" | "executives">[] {
  return csvData.map((row, index) => {
    const sanitizedName = row.name?.trim()
    const fallbackName = `インポート企業（行${index + 2}）`
    const sanitizedCorporateNumber = (row.corporate_number ?? "").replace(/[^0-9]/g, "")

    const normalizedTobToc = (() => {
      if (!row.tob_toc_type) return ''
      const value = row.tob_toc_type.trim().toUpperCase()
      if (['B', 'TOB', 'B2B'].includes(value)) return 'toB'
      if (['C', 'TOC', 'B2C'].includes(value)) return 'toC'
      if (['BOTH', 'B2B2C', 'B&C', 'B/C'].includes(value)) return 'Both'
      return ''
    })()

    return {
      name: sanitizedName && sanitizedName.length > 0 ? sanitizedName : fallbackName,
      corporate_number: sanitizedCorporateNumber,
      industry: row.industry?.trim() || '',
      employee_count: Number(row.employee_count) || 0,
      revenue: Number(row.revenue) || 0,
      location: row.location?.trim() || '',
      prefecture: row.prefecture?.trim() || '',
      city: row.city?.trim() || '',
      website_url: (row.website_url ?? row.website ?? '').trim() || '',
      contact_email: (row.contact_email ?? row.email ?? '').trim() || '',
      phone: row.phone?.trim() || '',
      description: (row.description ?? row.business_description ?? row.notes ?? '').trim() || '',
      business_description: row.business_description?.trim() || '',
      status: (row.status?.toLowerCase() as Company['status']) || 'prospect',
      contact_person_name: row.contact_person_name?.trim() || '',
      contact_person_position: row.contact_person_position?.trim() || '',
      facebook_url: row.facebook_url?.trim() || '',
      tob_toc_type: normalizedTobToc as Company['tob_toc_type'],
      capital: Number(row.capital) || 0,
      established_year: Number(row.established_year) || 0,
      notes: (row.notes ?? row.description ?? '').trim(),
      is_global_ng: false,
    }
  })
}

export function convertCompaniesArrayToCSV(companies: any[]): string {
  const headers = "name,corporate_number,industry,employee_count,revenue,prefecture,city,website_url,contact_email,phone,business_description"
  const rows = companies.map(company => {
    return [
      company.name || '',
      company.corporate_number || '',
      company.industry || '',
      company.employee_count || '',
      company.revenue || '', 
      company.prefecture || '',
      company.city || '',
      company.website_url || '',
      company.contact_email || '',
      company.phone || '',
      company.business_description || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  })
  
  return [headers, ...rows].join('\n')
}
