"use client"

import type React from "react"

import { useState } from "react"
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

interface ClientFormProps {
  client?: Client
  onSubmit: (data: Omit<Client, "id" | "created_at" | "updated_at">) => Promise<void>
}

const industryOptions = [
  "IT・ソフトウェア",
  "マーケティング・広告",
  "製造業",
  "金融・保険",
  "不動産",
  "小売・EC",
  "医療・ヘルスケア",
  "教育",
  "その他",
]

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
              <Select value={formData.industry} onValueChange={(value) => handleChange("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="業界を選択" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
