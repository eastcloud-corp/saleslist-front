"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ScrollToTopButton } from "@/components/common/scroll-to-top-button"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const mainRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const node = mainRef.current
    if (!node) return

    const updateVisibility = () => {
      const canScroll = node.scrollHeight - node.clientHeight > 16
      setShowScrollTop(canScroll)
    }

    updateVisibility()
    node.addEventListener("scroll", updateVisibility, { passive: true })

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateVisibility())
      resizeObserver.observe(node)
    }

    return () => {
      node.removeEventListener("scroll", updateVisibility)
      resizeObserver?.disconnect()
    }
  }, [])

  const handleScrollToTop = useCallback(() => {
    const node = mainRef.current
    if (!node) return
    node.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main ref={mainRef} className="flex-1 overflow-auto lg:ml-64">
          <div className="p-6 pt-16 lg:p-8 lg:pt-8">{children}</div>
          <ScrollToTopButton visible={showScrollTop} onClick={handleScrollToTop} />
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default MainLayout
