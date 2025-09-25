import type { Company } from "./types"

export interface CSVCompanyData {
  name: string
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
}

export const CSV_HEADERS = [
  "name",
  "industry",
  "employee_count",
  "revenue",
  "location",
  "website",
  "phone",
  "email",
  "description",
  "status",
] as const

export const CSV_HEADER_LABELS = {
  name: "Company Name",
  industry: "Industry",
  employee_count: "Employee Count",
  revenue: "Revenue (¥)",
  location: "Location",
  website: "Website",
  phone: "Phone",
  email: "Email",
  description: "Description",
  status: "Status",
} as const

export const CSV_FIELD_DISPLAY_NAMES: Record<string, string> = {
  name: "企業名",
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
}

export function exportCompaniesToCSV(companies: Company[]): string {
  const headers = CSV_HEADERS.map((header) => CSV_HEADER_LABELS[header]).join(",")

  const rows = companies.map((company) => {
    return CSV_HEADERS.map((header) => {
      let value = company[header as keyof Company]?.toString() || ""

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
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
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
    }

    headersRaw.forEach((originalHeader, i) => {
      const key = headerMap[i]
      if (!key) return
      const value = values[i]?.trim() ?? ""
      switch (key) {
        case "name":
        case "industry":
        case "employee_count":
        case "revenue":
        case "location":
        case "prefecture":
        case "city":
        case "phone":
        case "status":
          ;(record as Record<string, string | undefined>)[key] = value
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
          ;(record as Record<string, string | undefined>)[key] = value
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
    名前: "name",
    会社名: "name",
    企業名: "name",
    業種: "industry",
    "従業員数(あれば)": "employee_count",
    従業員数: "employee_count",
    "売上規模(あれば)": "revenue",
    売上規模: "revenue",
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
  }

  if (directMap[header]) {
    return directMap[header]
  }

  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "_")
  const headerMap: Record<string, string> = {
    company_name: "name",
    company: "name",
    name: "name",
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
    notes: "description",
    business_description: "business_description",
    status: "status",
    state: "status",
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

    // Validate status
    const validStatuses = ["active", "prospect", "inactive"]
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
      addError(
        "status",
        row.status,
        `次のいずれかの値を指定してください: ${validStatuses.join(", ")}`,
      )
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

    return {
      name: sanitizedName && sanitizedName.length > 0 ? sanitizedName : fallbackName,
      industry: row.industry?.trim() || "",
      employee_count: Number(row.employee_count) || 0,
      revenue: Number(row.revenue) || 0,
      location: row.location?.trim() || "",
      website: (row.website_url ?? row.website ?? "").trim() || "",
      phone: row.phone?.trim() || "",
      email: (row.contact_email ?? row.email ?? "").trim() || "",
      description: (row.description ?? row.business_description ?? "").trim() || "",
      status: (row.status?.toLowerCase() as "active" | "prospect" | "inactive") || "prospect",
      // Company型に必要な追加フィールド
      established_year: new Date().getFullYear(),
      prefecture: row.prefecture?.trim() || "",
      city: row.city?.trim() || "",
      website_url: (row.website_url ?? row.website ?? "").trim() || "",
      contact_email: (row.contact_email ?? row.email ?? "").trim() || "",
      notes: (row.description ?? "").trim(),
      is_global_ng: false,
      capital: 0,
    }
  })
}

export function convertCompaniesArrayToCSV(companies: any[]): string {
  const headers = "name,industry,employee_count,revenue,prefecture,city,website_url,contact_email,phone,business_description"
  const rows = companies.map(company => {
    return [
      company.name || '',
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
