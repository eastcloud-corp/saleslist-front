"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-config"

export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "user" | "viewer"
  created_at: string
  last_login?: string
  is_active: boolean
}

export interface UserInvitation {
  email: string
  role: "admin" | "user" | "viewer"
  message?: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching users...")

      const response = await apiClient.get("/auth/users/")
      console.log("[v0] Users API response:", response)

      if (response.ok) {
        const data = await response.json()
        setUsers(data.results || [])
      } else {
        throw new Error("ユーザー一覧の取得に失敗しました")
      }
    } catch (err) {
      console.error("[v0] Users fetch error:", err)
      setError("ユーザー一覧の取得に失敗しました")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const inviteUser = async (invitation: UserInvitation) => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Inviting user:", invitation)

      const response = await apiClient.post("/auth/users/create/", {
        name: invitation.email.split('@')[0], // emailからデフォルト名
        email: invitation.email,
        role: invitation.role,
        password: 'temp123' // 一時パスワード
      })
      console.log("[v0] User creation response:", response)

      // 成功時はユーザー一覧を再取得
      await fetchUsers()
      return { success: true, message: "ユーザー招待を送信しました" }
    } catch (err) {
      console.error("[v0] User invitation error:", err)
      const errorMessage = "ユーザー招待の送信に失敗しました"
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: number, role: User["role"]) => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Updating user role:", { userId, role })

      const response = await apiClient.patch(`/auth/users/${userId}/`, { role })
      console.log("[v0] User role update response:", response)

      // 成功時はユーザー一覧を再取得
      await fetchUsers()
      return { success: true, message: "ユーザー権限を更新しました" }
    } catch (err) {
      console.error("[v0] User role update error:", err)
      const errorMessage = "ユーザー権限の更新に失敗しました"
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Updating user status:", { userId, isActive })

      const response = await apiClient.patch(`/auth/users/${userId}/`, { is_active: isActive })
      console.log("[v0] User status update response:", response)

      // 成功時はユーザー一覧を再取得
      await fetchUsers()
      return { success: true, message: `ユーザーを${isActive ? '有効化' : '無効化'}しました` }
    } catch (err) {
      console.error("[v0] User status update error:", err)
      const errorMessage = `ユーザーの${isActive ? '有効化' : '無効化'}に失敗しました`
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const deactivateUser = async (userId: number) => {
    return await updateUserStatus(userId, false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    refetch: fetchUsers, // エイリアスを追加
    inviteUser,
    updateUserRole,
    updateUserStatus,
    deactivateUser,
  }
}
