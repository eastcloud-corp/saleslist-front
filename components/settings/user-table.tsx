"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, UserX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUsers, type User } from "@/hooks/use-users"
import { ConfirmDialog } from "@/components/common/confirm-dialog"

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  const { updateUserRole, deactivateUser, loading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const getRoleBadge = (role: User["role"]) => {
    const variants = {
      admin: "destructive",
      user: "default",
      viewer: "secondary",
    } as const

    const labels = {
      admin: "管理者",
      user: "一般ユーザー",
      viewer: "閲覧者",
    }

    return <Badge variant={variants[role]}>{labels[role]}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return <Badge variant={isActive ? "default" : "outline"}>{isActive ? "有効" : "無効"}</Badge>
  }

  const handleRoleChange = async (userId: number, newRole: User["role"]) => {
    await updateUserRole(userId, newRole)
  }

  const handleDeactivateUser = async (userId: number) => {
    await deactivateUser(userId)
    setSelectedUserId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ユーザー名</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>権限</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>最終ログイン</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead className="w-[70px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: User["role"]) => handleRoleChange(user.id, value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">閲覧者</SelectItem>
                    <SelectItem value="user">一般ユーザー</SelectItem>
                    <SelectItem value="admin">管理者</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{getStatusBadge(user.is_active)}</TableCell>
              <TableCell>{user.last_login ? formatDate(user.last_login) : "未ログイン"}</TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedUserId(user.id)}
                      className="text-destructive"
                      disabled={!user.is_active}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      ユーザー無効化
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={selectedUserId !== null}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
        title="ユーザー無効化の確認"
        description="このユーザーを無効化しますか？無効化されたユーザーはシステムにログインできなくなります。"
        onConfirm={() => selectedUserId && handleDeactivateUser(selectedUserId)}
        confirmText="無効化"
        cancelText="キャンセル"
      />
    </>
  )
}
