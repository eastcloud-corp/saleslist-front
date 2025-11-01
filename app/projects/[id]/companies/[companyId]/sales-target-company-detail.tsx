"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Building2, ExternalLink, Calendar, History, Plus, TrendingUp, Edit, Trash2, Shield, ShieldOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-config"

interface SalesTargetCompanyDetailProps {
  projectId: string
  companyId: string
}

interface ProjectCompany {
  id: number
  project_id: number
  company_id: number
  company: any
  status: string
  contact_date?: string
  next_action?: string
  notes?: string
  staff_name?: string
  added_at: string
  updated_at: string
}

interface SalesHistory {
  id: number
  status: string
  status_date: string
  staff_name?: string
  notes?: string
  created_at: string
}

const statusOptions = [
  { value: "未接触", label: "未接触", color: "#6B7280" },
  { value: "DM送信済み", label: "DM送信済み", color: "#F59E0B" },
  { value: "返信あり", label: "返信あり", color: "#3B82F6" },
  { value: "アポ獲得", label: "アポ獲得", color: "#10B981" },
  { value: "成約", label: "成約", color: "#059669" },
  { value: "NG", label: "NG", color: "#DC2626" },
]

export function SalesTargetCompanyDetail({ projectId, companyId }: SalesTargetCompanyDetailProps) {
  const [projectCompany, setProjectCompany] = useState<ProjectCompany | null>(null)
  const [salesHistory, setSalesHistory] = useState<SalesHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingHistory, setIsAddingHistory] = useState(false)
  const [newHistoryStatus, setNewHistoryStatus] = useState("")
  const [newHistoryDate, setNewHistoryDate] = useState(new Date().toISOString().split('T')[0])
  const [newHistoryStaff, setNewHistoryStaff] = useState("")
  const [newHistoryNotes, setNewHistoryNotes] = useState("")
  const [editingHistory, setEditingHistory] = useState<SalesHistory | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [projectId, companyId])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 案件企業情報を取得
      const pcResponse = await apiClient.get(`/projects/${projectId}/companies/${companyId}/detail/`)
      if (pcResponse.ok) {
        const pcData = await pcResponse.json()
        setProjectCompany(pcData)
      }

      // 営業履歴を取得
      const historyResponse = await apiClient.get(`/projects/${projectId}/companies/${companyId}/history/`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setSalesHistory(historyData.results || [])
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      setError("データの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddHistory = async () => {
    if (!newHistoryStatus) {
      toast({
        title: "エラー",
        description: "ステータスを選択してください",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiClient.post(`/projects/${projectId}/companies/${companyId}/history/`, {
        status: newHistoryStatus,
        status_date: newHistoryDate,
        staff_name: newHistoryStaff,
        notes: newHistoryNotes,
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "営業履歴を追加しました"
        })
        
        // フォームをリセット
        setNewHistoryStatus("")
        setNewHistoryDate(new Date().toISOString().split('T')[0])
        setNewHistoryStaff("")
        setNewHistoryNotes("")
        setIsAddingHistory(false)
        
        // データを再取得
        await fetchData()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "営業履歴の追加に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleEditHistory = (history: SalesHistory) => {
    setEditingHistory(history)
    setNewHistoryStatus(history.status)
    setNewHistoryDate(history.status_date)
    setNewHistoryStaff(history.staff_name || "")
    setNewHistoryNotes(history.notes || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdateHistory = async () => {
    if (!editingHistory || !newHistoryStatus) {
      toast({
        title: "エラー",
        description: "ステータスを選択してください",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiClient.put(`/projects/${projectId}/companies/${companyId}/history/${editingHistory.id}`, {
        status: newHistoryStatus,
        status_date: newHistoryDate,
        staff_name: newHistoryStaff,
        notes: newHistoryNotes,
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "営業履歴を更新しました"
        })
        setIsEditDialogOpen(false)
        setEditingHistory(null)
        await fetchData()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "営業履歴の更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleDeleteHistory = async (historyId: number) => {
    if (!confirm("この営業履歴を削除しますか？")) return

    try {
      const response = await apiClient.delete(`/projects/${projectId}/companies/${companyId}/history/${historyId}`)

      if (response.ok) {
        toast({
          title: "成功",
          description: "営業履歴を削除しました"
        })
        await fetchData()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "営業履歴の削除に失敗しました",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status)
    const color = statusInfo?.color || "#6B7280"
    
    return (
      <Badge style={{ backgroundColor: color, color: 'white' }}>
        {status}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div>読み込み中...</div>
        </div>
      </MainLayout>
    )
  }

  if (error || !projectCompany) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                案件詳細に戻る
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-destructive">{error || "データが見つかりません"}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              案件詳細に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              営業先企業詳細
            </h1>
            <p className="text-muted-foreground">{projectCompany.company.name} の営業進捗管理</p>
          </div>
        </div>

        {/* Company Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>企業基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">企業名</h4>
                <p className="font-medium">{projectCompany.company.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">業界</h4>
                <p>{projectCompany.company.industry}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">所在地</h4>
                <p>{projectCompany.company.prefecture} {projectCompany.company.city}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">従業員数</h4>
                <p>{projectCompany.company.employee_count}名</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">現在のステータス</h4>
                {getStatusBadge(projectCompany.status)}
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">案件追加日</h4>
                <p>{formatDate(projectCompany.added_at)}</p>
              </div>
            </div>
            {projectCompany.company.website_url && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">ウェブサイト</h4>
                <a
                  href={projectCompany.company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {projectCompany.company.website_url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                営業履歴
              </CardTitle>
              <Dialog open={isAddingHistory} onOpenChange={setIsAddingHistory}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    履歴追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>営業履歴追加</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      ステータスや日付、メモを入力して新しい営業履歴を追加します。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>ステータス *</Label>
                      <Select value={newHistoryStatus} onValueChange={setNewHistoryStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>日付 *</Label>
                      <Input
                        type="date"
                        value={newHistoryDate}
                        onChange={(e) => setNewHistoryDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>担当者</Label>
                      <Input
                        placeholder="担当者名"
                        value={newHistoryStaff}
                        onChange={(e) => setNewHistoryStaff(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>メモ</Label>
                      <Textarea
                        placeholder="営業活動の詳細..."
                        value={newHistoryNotes}
                        onChange={(e) => setNewHistoryNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddHistory}>
                        <Plus className="h-4 w-4 mr-2" />
                        履歴追加
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingHistory(false)}>
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {salesHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                営業履歴がありません
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ステータス</TableHead>
                    <TableHead>日付</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>メモ</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{getStatusBadge(history.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(history.status_date)}
                        </div>
                      </TableCell>
                      <TableCell>{history.staff_name || "-"}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm line-clamp-2">{history.notes || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditHistory(history)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteHistory(history.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Current Status & Next Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              現在の営業状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">現在のステータス</h4>
                {getStatusBadge(projectCompany.status)}
              </div>
              <div>
                <h4 className="font-medium mb-2">最終接触日</h4>
                <p>{projectCompany.contact_date ? formatDate(projectCompany.contact_date) : "未設定"}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">次回アクション</h4>
                <p className="text-sm">{projectCompany.next_action || "未設定"}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">案件メモ</h4>
                <p className="text-sm">{projectCompany.notes || "メモなし"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit History Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>営業履歴編集</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                選択した履歴の内容を修正し、保存します。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>ステータス *</Label>
                <Select value={newHistoryStatus} onValueChange={setNewHistoryStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>日付 *</Label>
                <Input
                  type="date"
                  value={newHistoryDate}
                  onChange={(e) => setNewHistoryDate(e.target.value)}
                />
              </div>
              <div>
                <Label>担当者</Label>
                <Input
                  placeholder="担当者名"
                  value={newHistoryStaff}
                  onChange={(e) => setNewHistoryStaff(e.target.value)}
                />
              </div>
              <div>
                <Label>メモ</Label>
                <Textarea
                  placeholder="営業活動の詳細..."
                  value={newHistoryNotes}
                  onChange={(e) => setNewHistoryNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateHistory}>
                  <Edit className="h-4 w-4 mr-2" />
                  更新
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
