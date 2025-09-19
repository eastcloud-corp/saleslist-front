import {
  CSV_HEADERS,
  CSV_HEADER_LABELS,
  convertCSVToCompanyData,
  parseCSV,
  validateCSVData,
} from "@/lib/csv-utils"

describe("csv-utils", () => {
  const buildCSVText = (...rows: string[]) => {
    const headerLine = CSV_HEADERS.map((key) => CSV_HEADER_LABELS[key]).join(",")
    return [headerLine, ...rows].join("\n")
  }

  it("parses the template format without errors", () => {
    const csvText = buildCSVText(
      "Tech Solutions Inc.,Technology,150,5000000,Tokyo Japan,https://techsolutions.com,+81-3-1234-5678,contact@techsolutions.com,Leading technology solutions provider,active"
    )

    const parsed = parseCSV(csvText)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      name: "Tech Solutions Inc.",
      industry: "Technology",
      employee_count: "150",
      revenue: "5000000",
      status: "active",
    })
    const errors = validateCSVData(parsed)
    expect(errors).toHaveLength(0)
  })

  it("returns descriptive errors for invalid numeric fields", () => {
    const csvText = buildCSVText(
      "Example Corp.,Consulting,abc,5000000,Tokyo,https://example.com,03-0000-0000,info@example.com,Notes,active"
    )

    const parsed = parseCSV(csvText)
    const errors = validateCSVData(parsed)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      row: 2,
      field: "employee_count",
    })
    expect(errors[0].message).toContain("「従業員数」列: 数値で入力してください")
  })

  it("returns descriptive errors for missing required fields", () => {
    const csvText = buildCSVText(
      ",Consulting,150,5000000,Tokyo,https://example.com,03-0000-0000,info@example.com,Notes,active"
    )

    const parsed = parseCSV(csvText)
    const errors = validateCSVData(parsed)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      row: 2,
      field: "name",
    })
    expect(errors[0].message).toContain("「企業名」列: 必須項目です")
  })

  it("converts valid CSV rows into company payloads", () => {
    const csvText = buildCSVText(
      "Growth Partners,Finance,200,8000000,Osaka,https://growthpartners.jp,06-1234-5678,contact@growthpartners.jp,Finance support,prospect"
    )
    const parsed = parseCSV(csvText)
    const companies = convertCSVToCompanyData(parsed)

    expect(companies).toHaveLength(1)
    expect(companies[0]).toMatchObject({
      name: "Growth Partners",
      industry: "Finance",
      employee_count: 200,
      revenue: 8000000,
      status: "prospect",
      is_global_ng: false,
    })
  })
})

