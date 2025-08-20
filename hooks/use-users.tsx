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

      const response = await apiClient.get("/users/")
      console.log("[v0] Users API response:", response)

      if (response.results) {
        setUsers(response.results)
      } else {
        // モックデータ（APIが未実装の場合）
        setUsers([
          {
            id: 1,
            name: "管理者",
            email: "admin@example.com",
            role: "admin",
            created_at: "2025-01-01T00:00:00Z",
            last_login: "2025-01-20T10:00:00Z",
            is_active: true,
          },
          {
            id: 2,
            name: "田中太郎",
            email: "tanaka@example.com",
            role: "user",
            created_at: "2025-01-05T00:00:00Z",
            last_login: "2025-01-19T15:30:00Z",
            is_active: true,
          },
        ])
      }
    } catch (err) {
      console.error("[v0] Users fetch error:", err)
      setError("ユーザー一覧の取得に失敗しました")
      // エラー時もモックデータを表示
      setUsers([
        {
          id: 1,
          name: "管理者",
          email: "admin@example.com",
          role: "admin",
          created_at: "2025-01-01T00:00:00Z",
          last_login: "2025-01-20T10:00:00Z",
          is_active: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const inviteUser = async (invitation: UserInvitation) => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Inviting user:", invitation)

      const response = await apiClient.post("/users/invite/", invitation)
      console.log("[v0] User invitation response:", response)

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

      const response = await apiClient.patch(`/users/${userId}/`, { role })
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

  const deactivateUser = async (userId: number) => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Deactivating user:", userId)

      const response = await apiClient.patch(`/users/${userId}/`, { is_active: false })
      console.log("[v0] User deactivation response:", response)

      // 成功時はユーザー一覧を再取得
      await fetchUsers()
      return { success: true, message: "ユーザーを無効化しました" }
    } catch (err) {
      console.error("[v0] User deactivation error:", err)
      const errorMessage = "ユーザーの無効化に失敗しました"
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    inviteUser,
    updateUserRole,
    deactivateUser,
  }
}
