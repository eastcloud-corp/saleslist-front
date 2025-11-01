export type CompanyReviewFieldDefinition = {
  value: string
  label: string
}

export const COMPANY_REVIEW_FIELDS: CompanyReviewFieldDefinition[] = [
  { value: "corporate_number", label: "法人番号" },
  { value: "website_url", label: "WebサイトURL" },
  { value: "contact_email", label: "連絡先メール" },
  { value: "phone", label: "電話番号" },
  { value: "prefecture", label: "都道府県" },
  { value: "city", label: "所在地詳細" },
  { value: "industry", label: "業種" },
  { value: "employee_count", label: "従業員数" },
  { value: "revenue", label: "売上規模" },
  { value: "capital", label: "資本金" },
  { value: "established_year", label: "設立年" },
  { value: "tob_toc_type", label: "toB/toC 区分" },
  { value: "business_description", label: "事業内容" },
  { value: "notes", label: "備考" },
]

const EXTRA_FIELD_LABELS: Record<string, string> = {
  name: "企業名",
}

export const COMPANY_REVIEW_FIELD_LABELS: Record<string, string> = COMPANY_REVIEW_FIELDS.reduce(
  (acc, field) => {
    acc[field.value] = field.label
    return acc
  },
  { ...EXTRA_FIELD_LABELS } as Record<string, string>,
)

export const COMPANY_REVIEW_FILTER_OPTIONS = [
  { value: "all", label: "すべて" },
  ...COMPANY_REVIEW_FIELDS.map((field) => ({
    value: field.value,
    label: field.label,
  })),
]
