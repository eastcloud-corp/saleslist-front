"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ClientForm } from "@/components/clients/client-form"
import { useClient, useClients } from "@/hooks/use-clients"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"

interface ClientEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientEditPage({ params }: ClientEditPageProps) {
  const resolvedParams = use(params)
  const id = Number.parseInt(resolvedParams.id)

  return <ClientEditContent id={id} />
}

function ClientEditContent({ id }: { id: number }) {
  const router = useRouter()
  const { client, loading, error } = useClient(id)
  const { updateClient } = useClients()

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (error || !client) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <ErrorAlert message={error || "クライアントが見つかりません"} />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/clients/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            クライアント詳細に戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold">クライアント情報の編集</h1>
            <p className="text-gray-600">クライアント「{client.name}」の情報を編集します</p>
          </div>
        </div>

        <ClientForm
          client={client}
          onSubmit={async (data) => {
            await updateClient(id, data)
            router.push(`/clients/${id}`)
          }}
        />
      </div>
    </MainLayout>
  )
}


