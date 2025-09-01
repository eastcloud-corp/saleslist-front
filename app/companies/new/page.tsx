"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { CompanyForm } from "@/components/companies/company-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { apiClient } from "@/lib/api-config"
import { useToast } from "@/hooks/use-toast"

export default function NewCompanyPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSave = async (data: any) => {
    try {
      console.log("[v0] 企業作成開始:", data)
      
      const response = await apiClient.post("/companies/", data)
      
      if (response.ok) {
        const newCompany = await response.json()
        console.log("[v0] 企業作成成功:", newCompany)
        
        toast({
          title: "企業作成成功",
          description: `企業「${newCompany.name}」を作成しました`,
        })
        
        router.push("/companies")
      } else {
        throw new Error("企業の作成に失敗しました")
      }
    } catch (error) {
      console.error("[v0] 企業作成エラー:", error)
      toast({
        title: "企業作成失敗", 
        description: "企業の作成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/companies")
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              企業一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">新規企業登録</h1>
            <p className="text-muted-foreground">新しい企業をデータベースに追加</p>
          </div>
        </div>

        {/* Company Form */}
        <CompanyForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    </MainLayout>
  )
}
