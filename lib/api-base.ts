export function resolveApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL
  const internalUrl = process.env.NEXT_INTERNAL_API_URL

  if (publicUrl) return publicUrl
  if (typeof window === "undefined") {
    return internalUrl || "http://backend:8000"
  }

  if (internalUrl) return internalUrl

  if (window.location.port === "3010") {
    return "http://localhost:8010"
  }

  return window.location.origin
}
