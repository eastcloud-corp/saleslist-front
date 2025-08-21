"use client"
import type { Client } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, FolderOpen, Archive } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

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
            <TableHead>業界</TableHead>
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
                <div>
                  <div className="font-semibold">{client.name}</div>
                  {client.email && <div className="text-sm text-gray-500">{client.email}</div>}
                </div>
              </TableCell>
              <TableCell>{client.contact_person || "-"}</TableCell>
              <TableCell>{client.industry || "-"}</TableCell>
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
