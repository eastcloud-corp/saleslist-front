export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    // SSR環境では何もしない
    return false
  }

  try {
    if (navigator && "clipboard" in navigator && typeof navigator.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (error) {
    console.error("[clipboard] navigator.clipboard.writeText failed", error)
  }

  // フォールバック: 一時的なtextareaを使ったコピー
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.left = "-9999px"
    textarea.style.top = "0"

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const successful = document.execCommand("copy")

    document.body.removeChild(textarea)

    return successful
  } catch (error) {
    console.error("[clipboard] fallback copy failed", error)
    return false
  }
}



