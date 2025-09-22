"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Building2, FolderOpen, LogOut, Menu, BarChart3, X, Settings, Users, Edit3 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
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
    name: "企業管理",
    href: "/companies",
    icon: Building2,
  },
  {
    name: "設定",
    href: "/settings",
    icon: Settings,
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
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border">
            <h1 className="text-lg font-bold text-sidebar-foreground">セールスナビゲーター</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
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
          <div className="p-4 border-t border-sidebar-border space-y-3">
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
              className="w-full justify-center gap-2 text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
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
