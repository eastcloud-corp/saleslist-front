"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorAlert } from "@/components/common/error-alert"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle, X } from "lucide-react"
import type { CSVValidationError } from "@/lib/csv-utils"

interface ValidationStepProps {
  file: File
  csvData: any[]
  validationErrors: CSVValidationError[]
  isProcessing: boolean
  onCancel: () => void
  onContinue: () => void
}

export function ValidationStep({
  file,
  csvData,
  validationErrors,
  isProcessing,
  onCancel,
  onContinue,
}: ValidationStepProps) {
  if (isProcessing) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="CSVファイルを解析しています..." />
      </div>
    )
  }

  const formatErrorMessage = (error: CSVValidationError) => {
    const rowLabel = error.row > 0 ? `${error.row}行目` : "全体"
    const valueText = error.value && String(error.value).trim() ? `（入力値: ${error.value}）` : ""
    return `${rowLabel}: ${error.message}${valueText}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <span className="font-medium">{file.name}</span>
        <Badge variant="outline">{csvData.length}行</Badge>
      </div>

      {validationErrors.length > 0 ? (
        <ErrorAlert
          title={`${validationErrors.length}件のエラーを検出しました`}
          message="以下の内容を修正してから再度インポートしてください。"
          errors={validationErrors.slice(0, 10).map(formatErrorMessage)}
        />
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>CSVの検証が完了しました。{csvData.length}件の企業データをインポートできます。</AlertDescription>
        </Alert>
      )}

      {csvData.length > 0 && (
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h4 className="font-medium">データプレビュー（先頭5行）</h4>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name（企業名）</TableHead>
                  <TableHead>Industry（業種）</TableHead>
                  <TableHead>Employee Count（従業員数）</TableHead>
                  <TableHead>Revenue（売上）</TableHead>
                  <TableHead>Location（所在地）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.industry}</TableCell>
                    <TableCell>{row.employee_count}</TableCell>
                    <TableCell>{row.revenue}</TableCell>
                    <TableCell>{row.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          キャンセル
        </Button>
        {validationErrors.length === 0 && <Button onClick={onContinue}>インポートへ進む</Button>}
      </div>
    </div>
  )
}
