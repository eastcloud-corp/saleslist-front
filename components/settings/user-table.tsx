"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, UserX, UserCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUsers, type User } from "@/hooks/use-users"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useToast } from "@/hooks/use-toast"

interface UserTableProps {
  users: User[]
  onUserUpdated?: () => void
}

export function UserTable({ users, onUserUpdated }: UserTableProps) {
  const { updateUserRole, updateUserStatus, loading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null)
  const { toast } = useToast()

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
    try {
      await updateUserRole(userId, newRole)
      toast({
        title: "成功",
        description: "ユーザー権限を更新しました",
      })
      if (onUserUpdated) {
        onUserUpdated()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "権限の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleStatusToggle = async (userId: number, isActive: boolean) => {
    setSelectedUserId(userId)
    setActionType(isActive ? "activate" : "deactivate")
  }

  const handleConfirmStatusChange = async () => {
    if (!selectedUserId) return

    try {
      const newActiveState = actionType === "activate"
      const result = await updateUserStatus(selectedUserId, newActiveState)
      
      if (result.success) {
        toast({
          title: "成功",
          description: result.message,
        })
        if (onUserUpdated) {
          onUserUpdated()
        }
      } else {
        toast({
          title: "エラー",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: `ユーザーの${actionType === 'activate' ? '有効化' : '無効化'}に失敗しました`,
        variant: "destructive",
      })
    } finally {
      setSelectedUserId(null)
      setActionType(null)
    }
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
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={() => handleStatusToggle(user.id, !user.is_active)}
                    disabled={loading}
                  />
                  <span className="text-sm">{user.is_active ? "有効" : "無効"}</span>
                </div>
              </TableCell>
              <TableCell>{user.last_login ? formatDate(user.last_login) : "未ログイン"}</TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>
                <Badge variant={user.is_active ? "default" : "outline"}>
                  {user.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={selectedUserId !== null}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
        title={actionType === "activate" ? "ユーザー有効化の確認" : "ユーザー無効化の確認"}
        description={
          actionType === "activate" 
            ? "このユーザーを有効化しますか？有効化されたユーザーはシステムにログインできるようになります。"
            : "このユーザーを無効化しますか？無効化されたユーザーはシステムにログインできなくなります。"
        }
        onConfirm={handleConfirmStatusChange}
        confirmText={actionType === "activate" ? "有効化" : "無効化"}
        cancelText="キャンセル"
      />
    </>
  )
}
