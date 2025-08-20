"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { CompanyForm } from "@/components/companies/company-form"
import { ExecutiveList } from "@/components/companies/executive-list"
import { useCompany } from "@/hooks/use-company"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Edit, Trash2, ExternalLink, Building2, Calendar, Loader2 } from "lucide-react"

interface CompanyDetailPageProps {
  params: {
    id: string
  }
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const { company, isLoading, error, updateCompany, deleteCompany } = useCompany(params.id)

  const handleSave = async (data: any) => {
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
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">ステータス</h4>
                  {getStatusBadge(company.status)}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">従業員数</h4>
                  <p>{new Intl.NumberFormat("ja-JP").format(company.employee_count)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">売上</h4>
                  <p>{formatCurrency(company.revenue)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">所在地</h4>
                  <p>{company.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">ウェブサイト</h4>
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
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
                  {company.email ? (
                    <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                      {company.email}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">未設定</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">作成日</h4>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(company.created_at)}
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
        <ExecutiveList executives={company.executives} />
      </div>
    </MainLayout>
  )
}
