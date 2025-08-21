"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Download, Trash2, AlertCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNGList } from "@/hooks/use-ng-list"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ErrorAlert } from "@/components/common/error-alert"

interface NGListTabProps {
  clientId: number
}

export function NGListTab({ clientId }: NGListTabProps) {
  const [isImporting, setIsImporting] = useState(false)
  const { ngList, stats, isLoading, error, importCSV, deleteNG } = useNGList(clientId)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "エラー",
        description: "CSVファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      const result = await importCSV(file)

      toast({
        title: "インポート完了",
        description: `${result.imported_count}件のNGリストを登録しました（マッチ: ${result.matched_count}件）`,
      })

      if (result.errors.length > 0) {
        toast({
          title: "一部エラーがありました",
          description: `${result.errors.length}件のエラーがありました`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "インポートに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // ファイル入力をリセット
      event.target.value = ""
    }
  }

  const downloadTemplate = () => {
    const csv = "企業名,理由\n株式会社サンプル,競合他社\n○○商事,既存取引先\n"
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ng_list_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (ngId: number) => {
    if (confirm("このNG企業を削除しますか？")) {
      try {
        await deleteNG(ngId)
        toast({
          title: "削除完了",
          description: "NG企業を削除しました",
        })
      } catch (error) {
        toast({
          title: "エラー",
          description: "削除に失敗しました",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorAlert message={error} />
  }

  return (
    <div className="space-y-4">
      {/* インポートセクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            NGリストインポート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="cursor-pointer"
              />
            </div>
            <Button variant="outline" onClick={downloadTemplate} disabled={isImporting}>
              <Download className="mr-2 h-4 w-4" />
              テンプレート
            </Button>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">CSV形式で企業名とNG理由を一括登録できます</p>
            <p className="text-xs text-muted-foreground">ファイルサイズ上限: 10MB | 対応形式: CSV (UTF-8)</p>
          </div>
          {isImporting && (
            <div className="mt-4 flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm">インポート中...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NGリスト一覧 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              登録済みNGリスト ({stats.count}件)
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="default">マッチ済: {stats.matched_count}</Badge>
              <Badge variant="secondary">未マッチ: {stats.unmatched_count}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ngList.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">NGリストが登録されていません</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                CSVファイルをインポートしてNGリストを登録してください
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企業名</TableHead>
                  <TableHead>マッチ状態</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ngList.map((ng) => (
                  <TableRow key={ng.id}>
                    <TableCell className="font-medium">{ng.company_name}</TableCell>
                    <TableCell>
                      {ng.matched ? (
                        <Badge variant="default">マッチ済</Badge>
                      ) : (
                        <Badge variant="outline">未マッチ</Badge>
                      )}
                    </TableCell>
                    <TableCell>{ng.reason || "-"}</TableCell>
                    <TableCell>{new Date(ng.created_at).toLocaleDateString("ja-JP")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(ng.id)} className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
