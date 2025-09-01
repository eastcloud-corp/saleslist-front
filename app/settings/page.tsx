"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserInviteDialog } from "@/components/settings/user-invite-dialog"
import { UserTable } from "@/components/settings/user-table"
import { useUsers } from "@/hooks/use-users"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"
import { Users, Shield, SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  const { users, loading, error, refetch } = useUsers()

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground">システムの設定とユーザー管理を行います</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            ユーザー管理
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            権限設定
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="mr-2 h-4 w-4" />
            システム設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ユーザー管理</CardTitle>
                  <CardDescription>システムユーザーの招待、権限変更、無効化を行います</CardDescription>
                </div>
                <UserInviteDialog onUserCreated={refetch} />
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner className="mr-2" />
                  ユーザー一覧を読み込み中...
                </div>
              )}
              {error && <ErrorAlert message={error} />}
              {!loading && !error && <UserTable users={users} onUserUpdated={refetch} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>権限設定</CardTitle>
              <CardDescription>各権限レベルの詳細設定を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-destructive">管理者</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      全ての機能にアクセス可能。ユーザー管理、システム設定の変更が可能。
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold">一般ユーザー</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      企業データの閲覧・編集、案件管理が可能。ユーザー管理は不可。
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-muted-foreground">閲覧者</h3>
                    <p className="text-sm text-muted-foreground mt-1">データの閲覧のみ可能。編集・削除・作成は不可。</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>システム設定</CardTitle>
              <CardDescription>システム全体の設定を管理します</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">システム設定機能は今後のアップデートで追加予定です。</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  )
}
