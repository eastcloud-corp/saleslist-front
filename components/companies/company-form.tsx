"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Company } from "@/lib/types"
import { Save, X, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface CompanyFormProps {
  company?: Company // Made company prop optional for new company creation
  onSave: (data: Partial<Company>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface IndustryHierarchy {
  id: number
  name: string
  is_category: boolean
  sub_industries: IndustryHierarchy[]
}

const statuses = [
  { value: "active", label: "アクティブ" },
  { value: "prospect", label: "見込み客" },
  { value: "inactive", label: "非アクティブ" },
]

export function CompanyForm({ company, onSave, onCancel, isLoading = false }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company?.name || "",
    corporate_number: company?.corporate_number || "",
    industry: company?.industry || "",
    contact_person_name: company?.contact_person_name || "",
    contact_person_position: company?.contact_person_position || "",
    facebook_url: company?.facebook_url || "",
    facebook_page_id: company?.facebook_page_id || "",
    tob_toc_type: company?.tob_toc_type || "",
    business_description: company?.business_description || "",
    prefecture: company?.prefecture || "",
    city: company?.city || "",
    employee_count: company?.employee_count || 0,
    revenue: company?.revenue || 0,
    capital: company?.capital || 0,
    established_year: Number(company?.established_year) || new Date().getFullYear(),
    website_url: company?.website_url || "",
    contact_email: company?.contact_email || "",
    phone: company?.phone || "",
    notes: company?.notes || "",
    status: company?.status || "prospect",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [industryHierarchy, setIndustryHierarchy] = useState<IndustryHierarchy[]>([])
  const [industryQuery, setIndustryQuery] = useState(company?.industry || "")
  const [isIndustryFocused, setIsIndustryFocused] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const industryInputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 階層構造の業界データを取得
    const fetchIndustries = async () => {
      try {
        const hierarchyData = await apiClient.get<{ results?: IndustryHierarchy[] }>(
          `${API_CONFIG.ENDPOINTS.MASTER_INDUSTRIES}?hierarchy=true`
        )
        if (hierarchyData.results) {
          setIndustryHierarchy(hierarchyData.results)
        }
      } catch (error) {
        console.error('[company-form] 業界候補取得に失敗しました:', error)
      }
    }
    fetchIndustries()
  }, [])

  // 業界候補をフィルタリング
  const filteredHierarchyOptions = useMemo(() => {
    if (!industryQuery.trim()) {
      return industryHierarchy
    }
    const query = industryQuery.toLowerCase()
    return industryHierarchy
      .map((category) => {
        const matchingSubIndustries = category.sub_industries.filter((sub) =>
          sub.name.toLowerCase().includes(query)
        )
        if (
          category.name.toLowerCase().includes(query) ||
          matchingSubIndustries.length > 0
        ) {
          return {
            ...category,
            sub_industries: matchingSubIndustries.length > 0 ? matchingSubIndustries : category.sub_industries,
          }
        }
        return null
      })
      .filter((category): category is IndustryHierarchy => category !== null)
  }, [industryHierarchy, industryQuery])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleIndustrySelect = (categoryName: string, subIndustryName?: string) => {
    let industryValue: string
    if (subIndustryName) {
      // 業種が選択された場合：「カテゴリ名-業種名」の形式
      industryValue = `${categoryName}-${subIndustryName}`
    } else {
      // カテゴリのみ選択された場合：カテゴリ名のみ
      industryValue = categoryName
    }
    
    // onBlurのタイムアウトをクリア
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    
    setFormData((prev) => ({ ...prev, industry: industryValue }))
    setIndustryQuery(industryValue)
    setIsIndustryFocused(false)
    // フォーカスを外す
    if (industryInputRef.current) {
      industryInputRef.current.blur()
    }
  }

  // 入力欄にフォーカスがあるときだけ候補を表示（選択後は閉じる）
  const showIndustryDropdown = isIndustryFocused && filteredHierarchyOptions.length > 0

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "企業名は必須です"
    }

    if (!formData.industry) {
      newErrors.industry = "業界は必須です"
    }

    if (formData.employee_count < 0) {
      newErrors.employee_count = "従業員数は正の数である必要があります"
    }

    if (formData.revenue < 0) {
      newErrors.revenue = "売上は正の数である必要があります"
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = "無効なメール形式です"
    }

    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      newErrors.website_url = "ウェブサイトはhttp://またはhttps://で始まる必要があります"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
    } catch (error) {
      console.error("Failed to save company:", error)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{company ? "企業情報の編集" : "新規企業登録"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name">企業名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={isLoading}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            {/* Corporate Number */}
            <div>
              <Label htmlFor="corporate_number">法人番号</Label>
              <Input
                id="corporate_number"
                value={formData.corporate_number}
                onChange={(e) => updateField("corporate_number", e.target.value)}
                placeholder="1234567890123"
                disabled={isLoading}
              />
            </div>

            {/* Contact Person */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person_name">担当者名</Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) => updateField("contact_person_name", e.target.value)}
                  placeholder="田中太郎"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="contact_person_position">担当者役職</Label>
                <Input
                  id="contact_person_position"
                  value={formData.contact_person_position}
                  onChange={(e) => updateField("contact_person_position", e.target.value)}
                  placeholder="営業部長"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Facebook URL */}
            <div>
              <Label htmlFor="facebook_url">Facebookリンク</Label>
              <Input
                id="facebook_url"
                type="url"
                value={formData.facebook_url}
                onChange={(e) => updateField("facebook_url", e.target.value)}
                placeholder="https://facebook.com/username"
                disabled={isLoading}
              />
            </div>

            {/* Facebook Page ID */}
            <div>
              <Label htmlFor="facebook_page_id">FacebookページID</Label>
              <Input
                id="facebook_page_id"
                value={formData.facebook_page_id}
                onChange={(e) => updateField("facebook_page_id", e.target.value)}
                placeholder="例: 123456789012345"
                disabled={isLoading}
              />
            </div>

            {/* Business Type */}
            <div>
              <Label htmlFor="tob_toc_type">toB/toC</Label>
              <Select value={formData.tob_toc_type} onValueChange={(value) => updateField("tob_toc_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="事業形態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toB">toB</SelectItem>
                  <SelectItem value="toC">toC</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Description */}
            <div>
              <Label htmlFor="business_description">事業内容</Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={(e) => updateField("business_description", e.target.value)}
                placeholder="主な事業内容を記載してください"
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Industry */}
            <div className="md:col-span-2">
              <Label htmlFor="industry">業界 *</Label>
              <p className="text-xs text-muted-foreground mb-1">
                業界カテゴリまたは業種を選択するか、自由に入力してください
              </p>
              <div className="relative">
                <Input
                  ref={industryInputRef}
                  id="industry"
                  value={industryQuery}
                  onChange={(e) => {
                    setIndustryQuery(e.target.value)
                    updateField("industry", e.target.value)
                  }}
                  placeholder="業界・業種を入力または選択（自由入力可）..."
                  disabled={isLoading}
                  className={errors.industry ? "border-destructive" : ""}
                  onFocus={() => setIsIndustryFocused(true)}
                  onBlur={(e) => {
                    // ドロップダウン内の要素へのフォーカス移動の場合は閉じない
                    const relatedTarget = e.relatedTarget as HTMLElement
                    if (!relatedTarget || !e.currentTarget.parentElement?.contains(relatedTarget)) {
                      // 既存のタイムアウトをクリア
                      if (blurTimeoutRef.current !== null) {
                        clearTimeout(blurTimeoutRef.current)
                      }
                      blurTimeoutRef.current = setTimeout(() => {
                        setIsIndustryFocused(false)
                        blurTimeoutRef.current = null
                      }, 120)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      // Enterキーで直接入力された場合はそのまま使用
                      const trimmed = industryQuery.trim()
                      if (trimmed) {
                        setFormData((prev) => ({ ...prev, industry: trimmed }))
                        setIsIndustryFocused(false)
                        if (industryInputRef.current) {
                          industryInputRef.current.blur()
                        }
                      }
                    }
                    if (event.key === "Escape") {
                      setIndustryQuery(formData.industry)
                      setIsIndustryFocused(false)
                      if (industryInputRef.current) {
                        industryInputRef.current.blur()
                      }
                    }
                  }}
                />
                {showIndustryDropdown && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
                    <ul className="max-h-56 overflow-auto py-1 text-sm">
                      {filteredHierarchyOptions.length > 0 ? (
                        filteredHierarchyOptions.map((category) => (
                          <li key={category.id}>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="flex-1 px-3 py-2 text-left hover:bg-gray-100 font-medium"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  handleIndustrySelect(category.name)
                                }}
                                title="業界カテゴリを選択"
                              >
                                {category.name}
                              </button>
                              {category.sub_industries && category.sub_industries.length > 0 && (
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    toggleCategory(category.id)
                                  }}
                                  title="業種を展開/折りたたみ"
                                >
                                  {expandedCategories.has(category.id) ? '−' : '+'}
                                </button>
                              )}
                            </div>
                            {expandedCategories.has(category.id) && category.sub_industries && (
                              <ul className="pl-4">
                                {category.sub_industries.map((sub) => (
                                  <li key={sub.id}>
                                    <button
                                      type="button"
                                      className="w-full px-3 py-1.5 text-left hover:bg-gray-100 text-xs"
                                      onMouseDown={(event) => {
                                        event.preventDefault()
                                        handleIndustrySelect(category.name, sub.name)
                                      }}
                                    >
                                      {sub.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="px-2 py-1.5 text-muted-foreground">該当する業種が見つかりません</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {errors.industry && <p className="text-sm text-destructive mt-1">{errors.industry}</p>}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Count */}
            <div>
              <Label htmlFor="employee_count">従業員数</Label>
              <Input
                id="employee_count"
                type="number"
                min="0"
                value={formData.employee_count}
                onChange={(e) => updateField("employee_count", Number.parseInt(e.target.value) || 0)}
                disabled={isLoading}
                className={errors.employee_count ? "border-destructive" : ""}
              />
              {errors.employee_count && <p className="text-sm text-destructive mt-1">{errors.employee_count}</p>}
            </div>

            {/* Revenue */}
            <div>
              <Label htmlFor="revenue">売上規模 (¥)</Label>
              <Input
                id="revenue"
                type="number"
                min="0"
                value={formData.revenue}
                onChange={(e) => updateField("revenue", Number.parseInt(e.target.value) || 0)}
                disabled={isLoading}
                className={errors.revenue ? "border-destructive" : ""}
              />
              {errors.revenue && <p className="text-sm text-destructive mt-1">{errors.revenue}</p>}
            </div>

            {/* Capital */}
            <div>
              <Label htmlFor="capital">資本金 (¥)</Label>
              <Input
                id="capital"
                type="number"
                min="0"
                value={formData.capital}
                onChange={(e) => updateField("capital", Number.parseInt(e.target.value) || 0)}
                disabled={isLoading}
                placeholder="50000000"
              />
            </div>

            {/* Prefecture */}
            <div>
              <Label htmlFor="prefecture">都道府県</Label>
              <Input
                id="prefecture"
                value={formData.prefecture}
                onChange={(e) => updateField("prefecture", e.target.value)}
                disabled={isLoading}
                placeholder="東京都"
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city">市区町村</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={isLoading}
                placeholder="渋谷区"
              />
            </div>


            {/* Website */}
            <div>
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                type="url"
                value={formData.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                disabled={isLoading}
                className={errors.website_url ? "border-destructive" : ""}
              />
              {errors.website_url && <p className="text-sm text-destructive mt-1">{errors.website_url}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => updateField("contact_email", e.target.value)}
                disabled={isLoading}
                className={errors.contact_email ? "border-destructive" : ""}
              />
              {errors.contact_email && <p className="text-sm text-destructive mt-1">{errors.contact_email}</p>}
            </div>


            {/* Notes (企業管理メモ) */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">企業管理メモ</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                disabled={isLoading}
                placeholder="内部管理用のメモを記載してください"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "保存中..." : "変更を保存"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
