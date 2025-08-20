import type { Company } from "./types"

export interface CSVCompanyData {
  name: string
  industry: string
  employee_count: string
  revenue: string
  location: string
  website: string
  phone: string
  email: string
  description: string
  status: string
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
  const lines = csvText.split("\n").filter((line) => line.trim())

  if (lines.length < 2) {
    throw new Error("CSV file must contain at least a header row and one data row")
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const dataLines = lines.slice(1)

  return dataLines.map((line, index) => {
    const values = parseCSVLine(line)

    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2}: Expected ${headers.length} columns, got ${values.length}`)
    }

    const row: any = {}
    headers.forEach((header, i) => {
      // Map header variations to standard field names
      const normalizedHeader = normalizeHeader(header)
      row[normalizedHeader] = values[i]?.trim() || ""
    })

    return row as CSVCompanyData
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "_")

  // Map common header variations
  const headerMap: Record<string, string> = {
    company_name: "name",
    company: "name",
    employees: "employee_count",
    employee_count: "employee_count",
    staff_count: "employee_count",
    revenue: "revenue",
    annual_revenue: "revenue",
    sales: "revenue",
    industry: "industry",
    sector: "industry",
    location: "location",
    address: "location",
    city: "location",
    website: "website",
    url: "website",
    web: "website",
    phone: "phone",
    telephone: "phone",
    tel: "phone",
    email: "email",
    e_mail: "email",
    description: "description",
    notes: "description",
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

  data.forEach((row, index) => {
    const rowNumber = index + 2 // Account for header row

    // Required fields
    if (!row.name?.trim()) {
      errors.push({
        row: rowNumber,
        field: "name",
        value: row.name || "",
        message: "Company name is required",
      })
    }

    if (!row.industry?.trim()) {
      errors.push({
        row: rowNumber,
        field: "industry",
        value: row.industry || "",
        message: "Industry is required",
      })
    }

    // Validate employee count
    if (row.employee_count && isNaN(Number(row.employee_count))) {
      errors.push({
        row: rowNumber,
        field: "employee_count",
        value: row.employee_count,
        message: "Employee count must be a number",
      })
    }

    // Validate revenue
    if (row.revenue && isNaN(Number(row.revenue))) {
      errors.push({
        row: rowNumber,
        field: "revenue",
        value: row.revenue,
        message: "Revenue must be a number",
      })
    }

    // Validate email format
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        value: row.email,
        message: "Invalid email format",
      })
    }

    // Validate website format
    if (row.website && row.website.trim() && !/^https?:\/\/.+/.test(row.website)) {
      errors.push({
        row: rowNumber,
        field: "website",
        value: row.website,
        message: "Website must start with http:// or https://",
      })
    }

    // Validate status
    const validStatuses = ["active", "prospect", "inactive"]
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: "status",
        value: row.status,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      })
    }
  })

  return errors
}

export function convertCSVToCompanyData(
  csvData: CSVCompanyData[],
): Omit<Company, "id" | "created_at" | "updated_at" | "executives">[] {
  return csvData.map((row) => ({
    name: row.name?.trim() || "",
    industry: row.industry?.trim() || "",
    employee_count: Number(row.employee_count) || 0,
    revenue: Number(row.revenue) || 0,
    location: row.location?.trim() || "",
    website: row.website?.trim() || "",
    phone: row.phone?.trim() || "",
    email: row.email?.trim() || "",
    description: row.description?.trim() || "",
    status: (row.status?.toLowerCase() as "active" | "prospect" | "inactive") || "prospect",
  }))
}
