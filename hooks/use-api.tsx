import { authService } from "@/lib/auth"
"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

interface UseAPIOptions {
  enabled?: boolean
  onError?: (error: string) => void
}

export function useAPI<T>(
  endpoint: string,
  options: UseAPIOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { enabled = true, onError } = options

  const fetchData = async () => {
    // 認証チェック
    if (!authService.isAuthenticated()) {
      setIsLoading(false)
      return
    }

    if (!authService.isAuthenticated()) { setIsLoading(false); return; }
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(endpoint)
      const result = await apiClient.handleResponse<T>(response)
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'APIエラーが発生しました'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => {
    if (enabled) {
      fetchData()
    }
  }

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [endpoint, enabled])

  return {
    data,
    isLoading,
    error,
    refetch
  }
}