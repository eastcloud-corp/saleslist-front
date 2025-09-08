"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/types"
import { useClients } from "@/hooks/use-clients"
import { Save, X } from "lucide-react"

interface ProjectFormProps {
  project?: Project
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

import { useMasterData } from "@/hooks/use-master-data"

export function ProjectForm({ project, onSave, onCancel, isLoading = false }: ProjectFormProps) {
  const { statuses } = useMasterData()
  const [formData, setFormData] = useState({
    name: project?.name || "",
    client_id: project?.client_id || "",
    description: project?.description || "",
    manager: project?.manager || "",
    target_industry: project?.target_industry || "",
    target_company_size: project?.target_company_size || "",
    status: project?.status || "active",
    start_date: project?.start_date || "",
    end_date: project?.end_date || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { clients, loading: clientsLoading } = useClients({ limit: 100 })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "案件名は必須です"
    }

    if (!formData.client_id) {
      newErrors.client_id = "クライアントは必須です"
    }

    if (!formData.start_date) {
      newErrors.start_date = "契約開始日は必須です"
    }

    if (formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = "契約終了日は契約開始日より後である必要があります"
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
      console.error("Failed to save project:", error)
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
        <CardTitle>{project ? "案件を編集" : "新しい案件を作成"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name">案件名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={isLoading}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="client_id">クライアント *</Label>
              <Select value={formData.client_id?.toString()} onValueChange={(value) => updateField("client_id", value)}>
                <SelectTrigger className={errors.client_id ? "border-destructive" : ""}>
                  <SelectValue placeholder={clientsLoading ? "読み込み中..." : "クライアントを選択"} />
                </SelectTrigger>
                <SelectContent>
                  {!clientsLoading &&
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-destructive mt-1">{errors.client_id}</p>}
            </div>

            <div>
              <Label htmlFor="manager">担当者</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => updateField("manager", e.target.value)}
                disabled={isLoading}
                placeholder="バジェット側担当者名"
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.filter(s => s.category === 'project').map((status) => (
                    <SelectItem key={status.name} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_industry">ターゲット業界</Label>
              <Input
                id="target_industry"
                value={formData.target_industry}
                onChange={(e) => updateField("target_industry", e.target.value)}
                disabled={isLoading}
                placeholder="IT・ソフトウェア"
              />
            </div>

            <div>
              <Label htmlFor="target_company_size">ターゲット企業規模</Label>
              <Input
                id="target_company_size"
                value={formData.target_company_size}
                onChange={(e) => updateField("target_company_size", e.target.value)}
                disabled={isLoading}
                placeholder="50-500名"
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="start_date">契約開始日 *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                disabled={isLoading}
                className={errors.start_date ? "border-destructive" : ""}
              />
              {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date}</p>}
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="end_date">契約終了日</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
                disabled={isLoading}
                className={errors.end_date ? "border-destructive" : ""}
              />
              {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date}</p>}
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
              {isLoading ? "保存中..." : project ? "変更を保存" : "案件を作成"}
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
