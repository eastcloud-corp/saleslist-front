export function resolveApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://backend:8000"
    )
  }

  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_INTERNAL_API_URL ||
    window.location.origin
  )
}
