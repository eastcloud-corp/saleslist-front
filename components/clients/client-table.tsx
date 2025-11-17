"use client"
import type { Client } from "@/lib/types"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, FolderOpen, Archive, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "-"
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatEmployeeCount = (count?: number | null) => {
  if (count === null || count === undefined || Number.isNaN(Number(count))) {
    return "-"
  }
  return new Intl.NumberFormat("ja-JP").format(count)
}

interface ClientTableProps {
  clients: Client[]
  loading?: boolean
}

export function ClientTable({ clients, loading }: ClientTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">クライアントが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>クライアント名</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>Facebook</TableHead>
            <TableHead>業界</TableHead>
            <TableHead>従業員数</TableHead>
            <TableHead>売上</TableHead>
            <TableHead>所在地</TableHead>
            <TableHead>案件数</TableHead>
            <TableHead>進行中</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead className="w-[100px]">アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/clients/${client.id}`}
                  className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <div className="font-semibold text-foreground group-hover:text-blue-600">
                    {client.name}
                  </div>
                  {client.email && <div className="text-sm text-gray-500">{client.email}</div>}
                </Link>
              </TableCell>
              <TableCell>
                {client.contact_person ? (
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{client.contact_person}</p>
                    {client.contact_person_position && (
                      <p className="text-xs text-muted-foreground">{client.contact_person_position}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">未設定</span>
                )}
              </TableCell>
              <TableCell>
                {client.facebook_url ? (
                  <a
                    href={client.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Facebook
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">未設定</span>
                )}
              </TableCell>
              <TableCell>{client.industry || "-"}</TableCell>
              <TableCell>{formatEmployeeCount(client.employee_count)}</TableCell>
              <TableCell>{formatCurrency(client.revenue)}</TableCell>
              <TableCell>{client.prefecture || "-"}</TableCell>
              <TableCell>
                <span className="font-medium">{client.project_count || 0}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-blue-600">{client.active_project_count || 0}</span>
              </TableCell>
              <TableCell>
                <Badge variant={client.is_active ? "default" : "secondary"}>
                  {client.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(client.created_at), "yyyy/MM/dd", { locale: ja })}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      詳細表示
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/projects`)}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      案件一覧
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="mr-2 h-4 w-4" />
                      アーカイブ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
