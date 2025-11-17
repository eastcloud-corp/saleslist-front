"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Client } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"
import { ChevronDown, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface ClientFormProps {
  client?: Client
  onSubmit: (data: Omit<Client, "id" | "created_at" | "updated_at">) => Promise<void>
}

interface IndustryHierarchy {
  id: number
  name: string
  is_category: boolean
  sub_industries: IndustryHierarchy[]
}

export function ClientForm({ client, onSubmit }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: client?.name || "",
    contact_person: client?.contact_person || "",
    contact_person_position: client?.contact_person_position || "",
    email: client?.email || "",
    phone: client?.phone || "",
    industry: client?.industry || "",
    notes: client?.notes || "",
    facebook_url: client?.facebook_url || "",
    employee_count: client?.employee_count?.toString() || "",
    revenue: client?.revenue?.toString() || "",
    prefecture: client?.prefecture || "",
    is_active: client?.is_active ?? true,
  })

  const [industryHierarchy, setIndustryHierarchy] = useState<IndustryHierarchy[]>([])
  const [industryQuery, setIndustryQuery] = useState(client?.industry || "")
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
        console.error('[client-form] 業界候補取得に失敗しました:', error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("クライアント名は必須です")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onSubmit({
        ...formData,
        employee_count: formData.employee_count ? parseInt(formData.employee_count, 10) : null,
        revenue: formData.revenue ? parseInt(formData.revenue, 10) : null,
        projects: [],
        project_count: 0,
        active_project_count: 0,
      })

      router.push("/clients")
    } catch (err) {
      setError(err instanceof Error ? err.message : "クライアントの保存に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{client ? "クライアント編集" : "新規クライアント作成"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorAlert message={error} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">クライアント名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="株式会社〇〇"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">担当者名</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleChange("contact_person", e.target.value)}
                placeholder="山田 太郎"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person_position">担当者役職</Label>
              <Input
                id="contact_person_position"
                value={formData.contact_person_position}
                onChange={(e) => handleChange("contact_person_position", e.target.value)}
                placeholder="営業部長"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input
                id="facebook_url"
                value={formData.facebook_url}
                onChange={(e) => handleChange("facebook_url", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="03-1234-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">業界</Label>
              <p className="text-xs text-muted-foreground">
                業界カテゴリまたは業種を選択するか、自由に入力してください
              </p>
              <div className="relative">
                <Input
                  ref={industryInputRef}
                  id="industry"
                  value={industryQuery}
                  onChange={(e) => {
                    setIndustryQuery(e.target.value)
                    handleChange("industry", e.target.value)
                  }}
                  placeholder="業界・業種を入力または選択（自由入力可）..."
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefecture">都道府県</Label>
              <Input
                id="prefecture"
                value={formData.prefecture}
                onChange={(e) => handleChange("prefecture", e.target.value)}
                placeholder="東京都"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_count">従業員数</Label>
              <Input
                id="employee_count"
                type="number"
                value={formData.employee_count}
                onChange={(e) => handleChange("employee_count", e.target.value)}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue">売上規模（円）</Label>
              <Input
                id="revenue"
                type="number"
                value={formData.revenue}
                onChange={(e) => handleChange("revenue", e.target.value)}
                placeholder="1000000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="クライアントに関する特記事項"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label htmlFor="is_active">アクティブ状態</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoadingSpinner />}
              {client ? "更新" : "作成"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
