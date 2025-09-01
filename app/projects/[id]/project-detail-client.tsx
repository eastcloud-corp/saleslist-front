"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectCompanies } from "@/components/projects/project-companies"
import { SalesStatusManager } from "@/components/projects/sales-status-manager"
import { useProject } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Edit, Trash2, Calendar, FolderOpen, Loader2 } from "lucide-react"

interface ProjectDetailClientProps {
  projectId: string
}

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const { project, isLoading, error, updateProject, updateCompanyStatus, removeCompany } = useProject(projectId)

  const handleSave = async (data: any) => {
    try {
      await updateProject(data)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("この案件を削除してもよろしいですか？（ステータスが'削除済み'に変更されます）")) {
      return
    }

    setIsDeleting(true)
    try {
      console.log("[v0] プロジェクト削除（ステータス更新）:", projectId)
      
      // 物理削除ではなく、ステータス管理による論理削除
      await updateProject({ status: '削除済み' })
      
      console.log("[v0] プロジェクトステータス更新成功: 削除済み")
      router.push("/projects")
    } catch (error) {
      console.error("[v0] プロジェクト削除エラー:", error)
      setIsDeleting(false)
    }
  }

  const handleAddCompany = () => {
    router.push(`/projects/${projectId}/add-companies`)
  }

  const handleSalesStatusUpdate = async (companyId: string, status: string, notes?: string) => {
    try {
      await updateCompanyStatus(Number(companyId), { status, notes })
      console.log(`[v0] 営業ステータス更新成功: ${companyId} -> ${status}`)
    } catch (error) {
      console.error(`[v0] 営業ステータス更新エラー:`, error)
      throw error
    }
  }

  const handleToggleActive = async (companyId: string, isActive: boolean) => {
    try {
      await updateCompanyStatus(Number(companyId), { is_active: isActive })
      console.log(`[v0] 企業アクティブ状態更新成功: ${companyId} -> ${isActive}`)
    } catch (error) {
      console.error(`[v0] 企業アクティブ状態更新エラー:`, error)
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "未設定"
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      paused: "secondary",
      completed: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>案件情報を読み込み中...</span>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              案件一覧に戻る
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || "案件が見つかりません"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              案件一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderOpen className="h-8 w-8" />
              {project.name}
            </h1>
            <p className="text-muted-foreground">案件の詳細情報と企業管理</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "削除中..." : "削除"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Project Information */}
      {isEditing ? (
        <ProjectForm project={project} onSave={handleSave} onCancel={() => setIsEditing(false)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>案件情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">ステータス</h4>
                {getStatusBadge(project.status)}
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">契約開始日</h4>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.start_date || "")}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">契約終了日</h4>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.end_date || "")}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">企業数</h4>
                <p>{project.companies?.length || 0} 社</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">作成日</h4>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>
            {project.description && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">説明</h4>
                <p className="text-sm leading-relaxed">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Companies */}
      <ProjectCompanies
        companies={project.companies || []}
        onUpdateStatus={handleSalesStatusUpdate}
        onRemoveCompany={async (companyId: string) => { await removeCompany(Number(companyId)) }}
        onToggleActive={handleToggleActive}
        onAddCompany={handleAddCompany}
        projectId={projectId}
      />
    </div>
  )
}
