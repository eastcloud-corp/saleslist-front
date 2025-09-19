"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Save, X, Building2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface CompanySettingsData {
  company_name: string
  phone: string
  email: string
  website: string
  address: string
  postal_code: string
  description: string
  ceo_name: string
  established_year: number
  employee_count: number
}

interface CompanySettingsProps {
  onSave?: (data: CompanySettingsData) => void
}

const defaultSettings: CompanySettingsData = {
  company_name: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  postal_code: "",
  description: "",
  ceo_name: "",
  established_year: new Date().getFullYear(),
  employee_count: 0
}

export function CompanySettings({ onSave }: CompanySettingsProps) {
  const [formData, setFormData] = useState<CompanySettingsData>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load saved settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Try to load from localStorage first
      const savedSettings = localStorage.getItem("company_settings")
      if (savedSettings) {
        setFormData(JSON.parse(savedSettings))
      } else {
        // If no localStorage data, try API endpoint
        try {
          const response = await apiClient.get<CompanySettingsData>("/settings/company")
          setFormData(response)
        } catch (apiError) {
          // If API fails, use default settings
          console.log("API not available, using default settings")
        }
      }
    } catch (error) {
      console.error("Failed to load company settings:", error)
      toast({
        title: "設定の読み込みに失敗しました",
        description: "デフォルト設定を使用します",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.company_name.trim()) {
      newErrors.company_name = "会社名は必須です"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "無効なメール形式です"
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "ウェブサイトはhttp://またはhttps://で始まる必要があります"
    }

    if (formData.phone && !/^[\d\-\+\(\)\s]+$/.test(formData.phone)) {
      newErrors.phone = "無効な電話番号形式です"
    }

    if (formData.postal_code && !/^\d{3}-\d{4}$/.test(formData.postal_code)) {
      newErrors.postal_code = "郵便番号は000-0000の形式で入力してください"
    }

    if (formData.established_year < 1800 || formData.established_year > new Date().getFullYear()) {
      newErrors.established_year = "設立年は1800年から現在年までの範囲で入力してください"
    }

    if (formData.employee_count < 0) {
      newErrors.employee_count = "従業員数は正の数である必要があります"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem("company_settings", JSON.stringify(formData))

      // Try to save to API endpoint
      try {
        await apiClient.post("/settings/company", formData)
      } catch (apiError) {
        console.log("API save failed, data saved locally")
      }

      // Call onSave callback if provided
      if (onSave) {
        onSave(formData)
      }

      toast({
        title: "設定を保存しました",
        description: "会社情報が正常に保存されました",
      })
    } catch (error) {
      console.error("Failed to save company settings:", error)
      toast({
        title: "保存に失敗しました",
        description: "設定の保存中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFormData(defaultSettings)
    setErrors({})
    toast({
      title: "設定をリセットしました",
      description: "フォームが初期状態に戻りました",
    })
  }

  const updateField = (field: keyof CompanySettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            会社情報設定
          </CardTitle>
          <CardDescription>システムで使用する会社情報を設定します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">設定を読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          会社情報設定
        </CardTitle>
        <CardDescription>システムで使用する会社情報を設定します</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="md:col-span-2">
              <Label htmlFor="company_name">会社名 *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                disabled={isSaving}
                className={errors.company_name ? "border-destructive" : ""}
                placeholder="株式会社サンプル"
              />
              {errors.company_name && <p className="text-sm text-destructive mt-1">{errors.company_name}</p>}
            </div>

            {/* CEO Name */}
            <div>
              <Label htmlFor="ceo_name">代表者名</Label>
              <Input
                id="ceo_name"
                value={formData.ceo_name}
                onChange={(e) => updateField("ceo_name", e.target.value)}
                disabled={isSaving}
                placeholder="田中太郎"
              />
            </div>

            {/* Established Year */}
            <div>
              <Label htmlFor="established_year">設立年</Label>
              <Input
                id="established_year"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.established_year}
                onChange={(e) => updateField("established_year", Number.parseInt(e.target.value) || 0)}
                disabled={isSaving}
                className={errors.established_year ? "border-destructive" : ""}
              />
              {errors.established_year && <p className="text-sm text-destructive mt-1">{errors.established_year}</p>}
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
                disabled={isSaving}
                className={errors.employee_count ? "border-destructive" : ""}
              />
              {errors.employee_count && <p className="text-sm text-destructive mt-1">{errors.employee_count}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={isSaving}
                className={errors.phone ? "border-destructive" : ""}
                placeholder="03-1234-5678"
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isSaving}
                className={errors.email ? "border-destructive" : ""}
                placeholder="info@example.com"
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                disabled={isSaving}
                className={errors.website ? "border-destructive" : ""}
                placeholder="https://example.com"
              />
              {errors.website && <p className="text-sm text-destructive mt-1">{errors.website}</p>}
            </div>

            {/* Postal Code */}
            <div>
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
                disabled={isSaving}
                className={errors.postal_code ? "border-destructive" : ""}
                placeholder="123-4567"
              />
              {errors.postal_code && <p className="text-sm text-destructive mt-1">{errors.postal_code}</p>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                disabled={isSaving}
                placeholder="東京都渋谷区渋谷1-1-1 サンプルビル10F"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">会社概要</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                disabled={isSaving}
                placeholder="会社の事業内容や概要を記載してください"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "保存中..." : "設定を保存"}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              リセット
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
