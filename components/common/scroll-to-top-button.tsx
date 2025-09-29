"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUp } from "lucide-react"

interface ScrollToTopButtonProps {
  visible: boolean
  onClick: () => void
  className?: string
}

export function ScrollToTopButton({ visible, onClick, className }: ScrollToTopButtonProps) {
  if (!visible) return null

  return (
    <Button
      type="button"
      size="icon"
      aria-label="ページの先頭へ戻る"
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:shadow-xl",
        className,
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}

export default ScrollToTopButton
