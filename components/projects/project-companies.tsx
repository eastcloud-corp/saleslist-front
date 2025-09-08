"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProjectCompany } from "@/lib/types"
import { Building2, Plus, ExternalLink, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProjectCompaniesProps {
  companies: ProjectCompany[]
  onUpdateStatus: (companyId: string, status: string, notes?: string) => Promise<void>
  onRemoveCompany: (companyId: string) => Promise<void>
  onToggleActive: (companyId: string, isActive: boolean) => Promise<void>
  onAddCompany: () => void
  projectId: string | number
  isLoading?: boolean
}

import { useMasterData } from "@/hooks/use-master-data"

export function ProjectCompanies({
  companies,
  onUpdateStatus,
  onRemoveCompany,
  onToggleActive,
  onAddCompany,
  projectId,
  isLoading = false,
}: ProjectCompaniesProps) {
  const { toast } = useToast()

  const handleToggleActive = async (company: ProjectCompany, isActive: boolean) => {
    try {
      await onToggleActive(company.company_id?.toString() || company.id.toString(), isActive)
      toast({
        title: "成功",
        description: `企業を${isActive ? '有効化' : '無効化'}しました`,
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: `企業の${isActive ? '有効化' : '無効化'}に失敗しました`,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "未設定"
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find((s) => s.value === status)
    return (
      <Badge variant={statusConfig?.variant || "outline"}>
        {statusConfig?.label || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleStatusUpdate = async () => {
    if (!editingCompany || !newStatus) return

    try {
      await onUpdateStatus(editingCompany.company_id, newStatus, newNotes)
      setEditingCompany(null)
      setNewStatus("")
      setNewNotes("")
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  const openEditDialog = (company: ProjectCompany) => {
    setEditingCompany(company)
    setNewStatus(company.status)
    setNewNotes(company.notes || "")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Companies ({companies.length})
          </CardTitle>
          <Button onClick={onAddCompany} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            企業を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>この案件にはまだ企業が追加されていません</p>
            <p className="text-sm">企業を追加して営業進捗の管理を開始してください</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企業名</TableHead>
                  <TableHead>業界</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>最終接触</TableHead>
                  <TableHead>アクティブ</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((projectCompany) => {
                  const isActive = projectCompany.is_active !== false
                  
                  return (
                    <TableRow key={projectCompany.id} className={isActive ? "" : "opacity-60 bg-gray-50"}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{projectCompany.company_name || projectCompany.company?.name || "企業名不明"}</div>
                        {projectCompany.company?.website && (
                          <a
                            href={projectCompany.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                          >
                            {projectCompany.company?.website?.replace(/^https?:\/\//, "") || ""}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{projectCompany.company_industry || projectCompany.company?.industry || "-"}</TableCell>
                    <TableCell>
                      <Select 
                        value={projectCompany.status} 
                        onValueChange={(value) => onUpdateStatus(projectCompany.company?.id?.toString() || "", value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "未接触", label: "未接触" },
                            { value: "DM送信予定", label: "DM送信予定" },
                            { value: "DM送信済み", label: "DM送信済み" },
                            { value: "返信あり", label: "返信あり" },
                            { value: "アポ獲得", label: "アポ獲得" },
                            { value: "成約", label: "成約" },
                            { value: "NG", label: "NG" },
                          ].map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(projectCompany.contact_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => handleToggleActive(projectCompany, checked)}
                          disabled={isLoading}
                        />
                        <span className="text-sm">{isActive ? "有効" : "無効"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${projectId}/companies/${projectCompany.company_id || projectCompany.company?.id}`}>営業詳細</Link>
                      </Button>
                    </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
