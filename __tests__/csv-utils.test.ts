import {
  CSV_HEADERS,
  CSV_HEADER_LABELS,
  convertCSVToCompanyData,
  convertCompaniesArrayToCSV,
  downloadCSV,
  exportCompaniesToCSV,
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
      "John Smith,Tech Solutions Inc.,CEO,https://techsolutions.com,Technology,1234567890123,150,5000000,Tokyo Japan,,+81-3-1234-5678,contact@techsolutions.com,Leading technology solutions provider,active"
    )

    const parsed = parseCSV(csvText)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      contact_person_name: "John Smith",
      name: "Tech Solutions Inc.",
      corporate_number: "1234567890123",
      contact_person_position: "CEO",
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
      "Jane Doe,Example Corp.,Manager,https://example.com,Consulting,1234567890123,abc,5000000,Tokyo,,03-0000-0000,info@example.com,Notes,active"
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

  it("validates corporate number format", () => {
    const csvText = buildCSVText(
      "John Tester,Number Test Corp,Manager,https://number.test,Technology,12345,100,1000000,Tokyo,,+81-3-0000-0000,info@number.test,Notes,active"
    )

    const parsed = parseCSV(csvText)
    const errors = validateCSVData(parsed)

    expect(errors.some((error) => error.field === "corporate_number")).toBe(true)
    expect(errors.find((error) => error.field === "corporate_number")?.message).toContain(
      "法人番号はハイフンを除いた13桁の数字で入力してください",
    )
  })

  it("allows rows with missing company name or industry", () => {
    const csvText = buildCSVText(
      ",,,,,,150,5000000,Tokyo,,03-0000-0000,info@example.com,Notes,active"
    )

    const parsed = parseCSV(csvText)
    const errors = validateCSVData(parsed)

    expect(errors).toHaveLength(0)

    const companies = convertCSVToCompanyData(parsed)
    expect(companies).toHaveLength(1)
    expect(companies[0].name).toMatch(/インポート企業（行2）/)
    expect(companies[0].industry).toBe("")
  })

  it("converts valid CSV rows into company payloads", () => {
    const csvText = buildCSVText(
      "Mike Johnson,Growth Partners,Director,https://growthpartners.jp,Finance,1234567890123,200,8000000,Osaka,,06-1234-5678,contact@growthpartners.jp,Finance support,prospect"
    )
    const parsed = parseCSV(csvText)
    const companies = convertCSVToCompanyData(parsed)

    expect(companies).toHaveLength(1)
    expect(companies[0]).toMatchObject({
      name: "Growth Partners",
      industry: "Finance",
      corporate_number: "1234567890123",
      employee_count: 200,
      revenue: 8000000,
      status: "prospect",
    })
  })

  it("normalises headers and validates formats", () => {
    const headers = [
      'Company Name',
      'Corporate Number',
      'Website',
      'Email',
      'Status',
      'Revenue',
      'Employee Count',
      'Location',
      'Phone',
      'Description',
      'Industry',
    ]
    const csvText = `${headers.join(',')}\nSample Inc.,1234567890123,example.com,wrong-email,unknown,abc,xyz,Tokyo,+81-3-0000-0000,Test desc,Technology`

    const parsed = parseCSV(csvText)
    expect(parsed[0]).toMatchObject({
      name: 'Sample Inc.',
      corporate_number: '1234567890123',
      website: 'example.com',
      email: 'wrong-email',
      status: 'unknown',
      revenue: 'abc',
      employee_count: 'xyz',
      location: 'Tokyo',
      description: 'Test desc',
      industry: 'Technology',
    })

    const errors = validateCSVData(parsed)
    expect(errors).toHaveLength(5)
    expect(errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['email', 'status', 'revenue', 'employee_count', 'website'])
    )
  })

  it("throws descriptive error when column counts do not match", () => {
    const csvText = `${CSV_HEADER_LABELS.name},${CSV_HEADER_LABELS.industry}\n"OnlyOneColumn"`
    expect(() => parseCSV(csvText)).toThrow(/列数が一致しません/)
  })

  it("requires at least one data row", () => {
    const csvText = `${CSV_HEADER_LABELS.name},${CSV_HEADER_LABELS.industry}`
    expect(() => parseCSV(csvText)).toThrow(/ヘッダー行と1件以上のデータ行/)
  })

  it("supports exporting CSV content for download", () => {
    const appendChildSpy = jest.spyOn(document.body, 'appendChild')
    const removeChildSpy = jest.spyOn(document.body, 'removeChild')

    const originalCreate = (URL as unknown as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL

    const createObjectURLMock = jest.fn(() => 'blob:mock')

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    })

    downloadCSV('name\nExample', 'test.csv')

    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(createObjectURLMock).toHaveBeenCalled()

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()

    if (originalCreate) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreate,
      })
    } else {
      delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
    }
  })

  it('exports companies to CSV with proper escaping', () => {
    const companies = [
      {
        name: 'Alpha, Inc.',
        industry: 'IT',
        employee_count: 50,
        revenue: 1000000,
        location: 'Tokyo',
        website_url: 'https://alpha.example.com',
        contact_email: 'info@alpha.example.com',
        phone: '03-0000-0000',
        description: 'Leading "edge" provider',
        status: 'active',
      } as any,
    ]

    const csv = exportCompaniesToCSV(companies)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('企業名')
    expect(lines[1]).toContain('"Alpha, Inc."')
    expect(lines[1]).toContain('Leading ""edge"" provider')
  })

  it('converts companies array to CSV format', () => {
    const csv = convertCompaniesArrayToCSV([
      {
        name: 'Beta Corp',
        industry: 'Finance',
        employee_count: 200,
        revenue: 5000000,
        prefecture: 'Osaka',
        city: 'Osaka-shi',
        website_url: 'https://beta.example.jp',
        contact_email: 'sales@beta.example.jp',
        phone: '06-0000-0000',
        business_description: 'Consulting services',
      },
    ])

    expect(csv.split('\n')).toHaveLength(2)
    expect(csv).toContain('"Beta Corp"')
    expect(csv).toContain('"Consulting services"')
  })

  it('parses CSV rows containing escaped quotes', () => {
    const row = '"John ""Doe""","Quoted ""Name""",Manager,https://example.com,Industry,1234567890123,100,5000,Tokyo,,"03-0000-0000",info@example.com,"Notes with ""quotes""",active'
    const csvText = buildCSVText(row)
    const parsed = parseCSV(csvText)
    expect(parsed[0]).toMatchObject({
      contact_person_name: 'John "Doe"',
      name: 'Quoted "Name"',
      corporate_number: '1234567890123',
      contact_person_position: 'Manager',
      facebook_url: '',
      industry: 'Industry',
      employee_count: '100',
      revenue: '5000',
      prefecture: 'Tokyo',
      website: 'https://example.com',
      phone: '03-0000-0000',
      email: 'info@example.com',
      description: 'Notes with "quotes"',
      status: 'active',
    })
  })
})
