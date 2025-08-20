"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Company } from "@/lib/types"
import { Save, X } from "lucide-react"

interface CompanyFormProps {
  company: Company
  onSave: (data: Partial<Company>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const industries = [
  "テクノロジー",
  "製造業",
  "金融",
  "ヘルスケア",
  "小売",
  "教育",
  "不動産",
  "コンサルティング",
  "その他",
]

const statuses = [
  { value: "active", label: "アクティブ" },
  { value: "prospect", label: "見込み客" },
  { value: "inactive", label: "非アクティブ" },
]

export function CompanyForm({ company, onSave, onCancel, isLoading = false }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company.name,
    industry: company.industry,
    employee_count: company.employee_count,
    revenue: company.revenue,
    location: company.location,
    website: company.website,
    phone: company.phone,
    email: company.email,
    description: company.description,
    status: company.status,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "無効なメール形式です"
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "ウェブサイトはhttp://またはhttps://で始まる必要があります"
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
        <CardTitle>企業情報の編集</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Industry */}
            <div>
              <Label htmlFor="industry">業界 *</Label>
              <Select value={formData.industry} onValueChange={(value) => updateField("industry", value)}>
                <SelectTrigger className={errors.industry ? "border-destructive" : ""}>
                  <SelectValue placeholder="業界を選択" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="revenue">売上 (¥)</Label>
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

            {/* Location */}
            <div>
              <Label htmlFor="location">所在地</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                disabled={isLoading}
                className={errors.website ? "border-destructive" : ""}
              />
              {errors.website && <p className="text-sm text-destructive mt-1">{errors.website}</p>}
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
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isLoading}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                disabled={isLoading}
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
