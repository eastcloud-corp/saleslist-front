"use client"

import { useClients } from "@/hooks/use-clients"
import { ClientForm } from "@/components/clients/client-form"
import { MainLayout } from "@/components/layout/main-layout"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function NewClientPage() {
  const router = useRouter()
  const { createClient } = useClients()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold">新規クライアント作成</h1>
            <p className="text-gray-600">新しいクライアント企業を登録します</p>
          </div>
        </div>

        <ClientForm onSubmit={createClient} />
      </div>
    </MainLayout>
  )
}
