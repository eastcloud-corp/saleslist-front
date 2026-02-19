"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  Building2,
  FolderOpen,
  LogOut,
  Menu,
  BarChart3,
  X,
  Settings,
  Users,
  BookOpen,
  ClipboardList,
  History,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type NavigationItem = {
  name: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
  match?: (pathname: string) => boolean
}

const navigation: NavigationItem[] = [
  {
    name: "ダッシュボード",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "クライアント",
    href: "/clients",
    icon: Users,
  },
  {
    name: "案件",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    name: "DM作成補助",
    href: "/dm-assistant",
    icon: MessageSquare,
  },
  {
    name: "企業管理",
    href: "/companies",
    icon: Building2,
    match: (pathname) =>
      pathname === "/companies" ||
      (pathname.startsWith("/companies/") && !pathname.startsWith("/companies/reviews")),
  },
  {
    name: "会社情報自動取得レビュー",
    href: "/companies/reviews",
    icon: ClipboardList,
    adminOnly: true,
    match: (pathname) =>
      pathname === "/companies/reviews" || pathname.startsWith("/companies/reviews/"),
  },
  {
    name: "データ収集履歴",
    href: "/data-collection/history",
    icon: History,
    adminOnly: true,
    match: (pathname) => pathname.startsWith("/data-collection"),
  },
  {
    name: "設定",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "ユーザーガイド",
    href: "/user-guide",
    icon: BookOpen,
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border">
            <h1 className="text-lg font-bold text-sidebar-foreground">ソーシャルナビゲーター</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-2">
            {navigation.map((item) => {
              if (item.adminOnly && user?.role !== "admin") {
                return null
              }
              const isActive = item.match
                ? item.match(pathname)
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="shrink-0 space-y-3 border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-sidebar-primary-foreground">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate" title={user?.name || undefined}>
                  {user?.name || "ユーザー"}
                </p>
                {user?.email ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p
                        className="text-xs text-muted-foreground break-all leading-snug cursor-default"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      <span>{user.email}</span>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </div>
            <Button
              aria-label="ログアウト"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 overflow-hidden text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="truncate">ログアウト</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
