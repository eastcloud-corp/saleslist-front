"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { CompanyForm } from "@/components/companies/company-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewCompanyPage() {
  const router = useRouter()

  const handleSave = async (data: any) => {
    try {
      // TODO: Implement create company API call
      console.log("Creating company:", data)

      // For now, redirect to companies list
      router.push("/companies")
    } catch (error) {
      console.error("Failed to create company:", error)
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
