"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-auto">
          <div className="p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default MainLayout
