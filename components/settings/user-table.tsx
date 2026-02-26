"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUsers, type User } from "@/hooks/use-users"
import { useAuth } from "@/hooks/use-auth"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useToast } from "@/hooks/use-toast"

interface UserTableProps {
  users: User[]
  onUserUpdated?: () => void
}

export function UserTable({ users, onUserUpdated }: UserTableProps) {
  const { user: currentUser } = useAuth()
  const { updateUserRole, updateUserStatus, deleteUser, loading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<"deactivate" | "activate" | "delete" | null>(null)
  const { toast } = useToast()
  const currentUserId = currentUser?.id != null ? Number(currentUser.id) : null

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

  const handleStatusToggle = (userId: number, isActive: boolean) => {
    setSelectedUserId(userId)
    setActionType(isActive ? "activate" : "deactivate")
  }

  const handleDeleteClick = (userId: number) => {
    setSelectedUserId(userId)
    setActionType("delete")
  }

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return
    try {
      const result = await deleteUser(selectedUserId)
      if (result.success) {
        toast({ title: "成功", description: result.message })
        onUserUpdated?.()
      } else {
        toast({ title: "エラー", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "エラー", description: "ユーザーの削除に失敗しました", variant: "destructive" })
    } finally {
      setSelectedUserId(null)
      setActionType(null)
    }
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
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_active ? "default" : "outline"}>
                    {user.is_active ? "アクティブ" : "非アクティブ"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={currentUserId === user.id}
                        onClick={() => handleDeleteClick(user.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={selectedUserId !== null && actionType !== "delete"}
        onOpenChange={(open) => !open && (setSelectedUserId(null), setActionType(null))}
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

      <ConfirmDialog
        open={selectedUserId !== null && actionType === "delete"}
        onOpenChange={(open) => !open && (setSelectedUserId(null), setActionType(null))}
        title="ユーザー削除の確認"
        description="このユーザーを削除しますか？削除すると元に戻せません。"
        onConfirm={handleConfirmDelete}
        confirmText="削除"
        cancelText="キャンセル"
        variant="destructive"
      />
    </>
  )
}
