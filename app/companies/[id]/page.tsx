"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { CompanyForm } from "@/components/companies/company-form"
import { ExecutiveList } from "@/components/companies/executive-list"
import { useCompany } from "@/hooks/use-company"
import { apiClient } from "@/lib/api-config"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Edit, Trash2, ExternalLink, Building2, Calendar, Loader2, Shield, ShieldOff } from "lucide-react"

interface CompanyDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const resolvedParams = use(params)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { company, isLoading, error, updateCompany, deleteCompany } = useCompany(resolvedParams.id)
  const [isTogglingNG, setIsTogglingNG] = useState(false)

  const handleSave = async (data: Partial<Company>) => {
    try {
      await updateCompany(data)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update company:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("この企業を削除してもよろしいですか？この操作は取り消せません。")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteCompany()
      router.push("/companies")
    } catch (error) {
      console.error("Failed to delete company:", error)
      setIsDeleting(false)
    }
  }

  const handleToggleNG = async () => {
    if (!company) return

    const action = company.is_global_ng ? "解除" : "設定"
    if (!confirm(`企業「${company.name}」のグローバルNG状態を${action}しますか？`)) {
      return
    }

    setIsTogglingNG(true)
    try {
      const response = await apiClient.post(`/companies/${company.id}/toggle_ng/`, {
        reason: company.is_global_ng ? "" : "管理者による手動設定"
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "成功",
          description: result.message
        })
        // 企業データを更新するため再取得
        window.location.reload()
      } else {
        throw new Error("API エラー")
      }
    } catch (error) {
      console.error("Failed to toggle NG status:", error)
      toast({
        title: "エラー",
        description: "グローバルNG状態の更新に失敗しました",
        variant: "destructive"
      })
    } finally {
      setIsTogglingNG(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    if (!status) {
      return <Badge variant="outline">不明</Badge>
    }
    
    const variants = {
      active: "default",
      prospect: "secondary", 
      inactive: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>企業情報を読み込み中...</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !company) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/companies">
                <ArrowLeft className="h-4 w-4 mr-2" />
                企業一覧に戻る
              </Link>
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertDescription>{error || "企業が見つかりません"}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/companies">
                <ArrowLeft className="h-4 w-4 mr-2" />
                企業一覧に戻る
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                {company.name}
              </h1>
              <p className="text-muted-foreground">企業詳細と管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button 
                  variant={company?.is_global_ng ? "outline" : "destructive"} 
                  onClick={handleToggleNG} 
                  disabled={isTogglingNG}
                >
                  {company?.is_global_ng ? (
                    <><ShieldOff className="h-4 w-4 mr-2" />NG解除</>
                  ) : (
                    <><Shield className="h-4 w-4 mr-2" />NG設定</>
                  )}
                  {isTogglingNG && "中..."}
                </Button>
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

        {/* Company Information */}
        {isEditing ? (
          <CompanyForm company={company} onSave={handleSave} onCancel={() => setIsEditing(false)} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>企業情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">業界</h4>
                  <p>{company.industry}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">法人番号</h4>
                  <p>{company.corporate_number || '未設定'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">事業形態</h4>
                  <p>{company.tob_toc_type || '未設定'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">担当者</h4>
                  <p>{company.contact_person_name || '未設定'} {company.contact_person_position && `(${company.contact_person_position})`}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">資本金</h4>
                  <p>{company.capital ? `¥${company.capital.toLocaleString()}` : '未設定'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">ステータス</h4>
                  {getStatusBadge(company.status || "prospect")}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">グローバルNG設定</h4>
                  <Badge variant={company.is_global_ng ? "destructive" : "outline"}>
                    {company.is_global_ng ? "NG設定済み" : "通常"}
                  </Badge>
                  {company.is_global_ng && (
                    <p className="text-xs text-red-600 mt-1">※全案件で営業対象外</p>
                  )}
                </div>
                <div className="col-span-full">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">事業内容</h4>
                  <p className="text-sm">{company.business_description || '未設定'}</p>
                </div>
                {company.facebook_url && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Facebook</h4>
                    <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {company.facebook_url}
                    </a>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">従業員数</h4>
                  <p>
                    {company.employee_count !== null && company.employee_count !== undefined
                      ? new Intl.NumberFormat("ja-JP").format(company.employee_count)
                      : "未設定"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">売上</h4>
                  <p>
                    {company.revenue !== null && company.revenue !== undefined
                      ? formatCurrency(company.revenue)
                      : "未設定"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">所在地</h4>
                  <p>
                    {[company.prefecture, company.city].filter(Boolean).join(" ") || "未設定"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">ウェブサイト</h4>
                  {company.website_url ? (
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {company.website_url.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">未設定</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">電話番号</h4>
                  {company.phone ? (
                    <a href={`tel:${company.phone}`} className="text-primary hover:underline">
                      {company.phone}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">未設定</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">メールアドレス</h4>
                  {company.contact_email ? (
                    <a href={`mailto:${company.contact_email}`} className="text-primary hover:underline">
                      {company.contact_email}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">未設定</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">作成日</h4>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {company.created_at ? formatDate(company.created_at) : "不明"}
                  </p>
                </div>
              </div>
              {company.description && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">説明</h4>
                  <p className="text-sm leading-relaxed">{company.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Executives */}
        <ExecutiveList executives={company.executives || []} />
      </div>
    </MainLayout>
  )
}
