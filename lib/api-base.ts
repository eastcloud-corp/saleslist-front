export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // ローカル開発時はフロント 3010 → バックエンド 8010 に固定
    if (window.location.hostname === "localhost" && window.location.port === "3010") {
      return "http://localhost:8010"
    }

    return process.env.NEXT_PUBLIC_API_URL || window.location.origin
  }

  // SSR / API routes からの呼び出し
  return (
    process.env.NEXT_INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://backend:8000"
  )
}
