"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, History, TrendingUp, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SalesStatusManagerProps {
  projectCompanies: any[]
  onStatusUpdate: (companyId: number, status: string, notes?: string) => Promise<void>
}

const salesStatuses = [
  { value: "未着手", label: "未着手", color: "#6B7280" },
  { value: "ヒアリングシート記入中", label: "ヒアリングシート記入中", color: "#F59E0B" },
  { value: "キックオフMTG", label: "キックオフMTG", color: "#8B5CF6" },
  { value: "DM作成・確認/アカウント構築", label: "DM作成・確認/アカウント構築", color: "#3B82F6" },
  { value: "運用者アサイン中", label: "運用者アサイン中", color: "#06B6D4" },
  { value: "運用中", label: "運用中", color: "#10B981" },
  { value: "停止", label: "停止", color: "#DC2626" },
  { value: "解約", label: "解約", color: "#EF4444" },
  { value: "一時停止", label: "一時停止", color: "#F97316" },
  { value: "契約満了", label: "契約満了", color: "#84CC16" },
  { value: "開始時期未定・変更", label: "開始時期未定・変更", color: "#A855F7" },
  { value: "解体", label: "解体", color: "#71717A" },
  { value: "営業追いかけ", label: "営業追いかけ", color: "#EC4899" },
]

export function SalesStatusManager({ projectCompanies, onStatusUpdate }: SalesStatusManagerProps) {
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const getStatusBadge = (status: string) => {
    const statusInfo = salesStatuses.find(s => s.value === status)
    const color = statusInfo?.color || "#6B7280"
    
    return (
      <Badge 
        style={{ backgroundColor: color, color: 'white' }}
        className="text-xs"
      >
        {status || '未設定'}
      </Badge>
    )
  }

  const handleStatusUpdate = async (companyId: number) => {
    if (!newStatus) {
      toast({
        title: "ステータス選択エラー",
        description: "新しいステータスを選択してください",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      await onStatusUpdate(companyId, newStatus, statusNotes)
      
      toast({
        title: "ステータス更新成功",
        description: `営業ステータスを「${newStatus}」に更新しました`
      })
      
      setEditingCompany(null)
      setNewStatus("")
      setStatusNotes("")
    } catch (error) {
      toast({
        title: "ステータス更新失敗",
        description: "ステータスの更新に失敗しました",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          営業ステータス管理
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[350px]">企業名</TableHead>
              <TableHead>業界</TableHead>
              <TableHead>営業ステータス</TableHead>
              <TableHead>最終接触日</TableHead>
              <TableHead>担当者</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectCompanies.map((pc) => (
              <TableRow key={pc.id}>
                <TableCell className="font-medium max-w-[350px]">
                  <div className="truncate" title={pc.company_name}>{pc.company_name}</div>
                </TableCell>
                <TableCell>{pc.company_industry}</TableCell>
                <TableCell>
                  {editingCompany === pc.company?.id ? (
                    <div className="space-y-2">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="ステータス選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {salesStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="メモ（任意）"
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => pc.company?.id && handleStatusUpdate(pc.company.id)}
                          disabled={isUpdating}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          保存
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingCompany(null)}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getStatusBadge(pc.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          pc.company?.id && setEditingCompany(pc.company.id)
                          setNewStatus(pc.status || "")
                          setStatusNotes("")
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        変更
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {pc.contact_date ? new Date(pc.contact_date).toLocaleDateString('ja-JP') : '未設定'}
                </TableCell>
                <TableCell>{pc.staff_name || '未設定'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    <History className="h-3 w-3 mr-1" />
                    履歴
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}