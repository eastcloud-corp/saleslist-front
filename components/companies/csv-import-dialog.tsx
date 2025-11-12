"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UploadStep } from "./csv-steps/upload-step"
import { ValidationStep } from "./csv-steps/validation-step"
import { parseCSV, validateCSVData, type CSVValidationError, type CSVCompanyData } from "@/lib/csv-utils"
import { ApiError } from "@/lib/api-client"
import { Upload, CheckCircle } from "lucide-react"

export type ImportErrorCategory = "duplicate" | "validation" | "api" | "unknown"

export type ImportErrorItem = {
  name: string
  message: string
  category: ImportErrorCategory
}

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (
    file: File,
    context: { rowCount: number },
    onProgress: (progress: number) => void,
  ) => Promise<ImportSummary>
}

type ImportSummary = {
  successCount: number
  companyUpdatedCount: number
  executiveCreatedCount: number
  executiveUpdatedCount: number
  errorItems: ImportErrorItem[]
  missingCorporateNumberCount: number
  duplicateCount: number
  totalRows: number
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVCompanyData[]>([])
  const [validationErrors, setValidationErrors] = useState<CSVValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [step, setStep] = useState<"upload" | "validate" | "import" | "complete">("upload")
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setStep("validate")
    setImportSummary(null)
    processFile(selectedFile)
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)

    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      const errors = validateCSVData(parsed)

      setCsvData(parsed)
      setValidationErrors(errors)

      if (errors.length === 0) {
        setStep("import")
      }
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          field: "file",
          value: "",
          message: error instanceof Error ? error.message : "CSVファイルの解析に失敗しました。形式を確認してください。",
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!file || validationErrors.length > 0) return

    setIsImporting(true)
    setImportProgress(0)
    setImportSummary(null)

    try {
      const result = await onImport(file, { rowCount: csvData.length }, (progress) => {
        setImportProgress(Math.min(100, Math.max(progress, 0)))
      })

      setImportProgress(100)
      setImportSummary(result)
      setStep("complete")
    } catch (error) {
      console.error("Import failed:", error)

      if (error instanceof ApiError) {
        const data = error.data as { error?: string; errors?: Array<{ row?: number; field?: string; value?: string; message?: string }> } | undefined
        if (Array.isArray(data?.errors) && data!.errors.length > 0) {
          setValidationErrors(
            data!.errors.map((err) => ({
              row: err.row ?? 0,
              field: err.field ?? "import",
              value: err.value ?? "",
              message: err.message ?? (data?.error || (error instanceof Error ? error.message : String(error)) || "インポート処理でエラーが発生しました"),
            })),
          )
          setStep("validate")
          return
        }

        const message = data?.error || error.message || "インポート処理でエラーが発生しました。内容を確認して再度お試しください。"
        setValidationErrors([
          {
            row: 0,
            field: "import",
            value: "",
            message,
          },
        ])
        setStep("validate")
      } else {
        setValidationErrors([
          {
            row: 0,
            field: "import",
            value: "",
            message: "インポート処理でエラーが発生しました。内容を確認して再度お試しください。",
          },
        ])
        setStep("validate")
      }
    } finally {
      setIsImporting(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setCsvData([])
    setValidationErrors([])
    setIsProcessing(false)
    setIsImporting(false)
    setImportProgress(0)
    setStep("upload")
    setImportSummary(null)
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(95vw,1200px)] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSVから企業データをインポート
          </DialogTitle>
          <DialogDescription>
            企業CSVファイルをアップロードし、内容を検証してからインポートする操作を行います。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === "upload" && <UploadStep onFileSelect={handleFileSelect} />}

          {step === "validate" && file && (
            <ValidationStep
              file={file}
              csvData={csvData}
              validationErrors={validationErrors}
              isProcessing={isProcessing}
              onCancel={resetDialog}
              onContinue={() => setStep("import")}
            />
          )}

          {step === "import" && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
          {csvData.length}件の企業データをインポートします。この操作により新しい企業が登録・更新されます。
        </AlertDescription>
      </Alert>

      {isImporting && (
        <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                <span>インポート中...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
      )}

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setStep("validate")} disabled={isImporting}>
                  戻る
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? "インポート中..." : `インポート開始（${csvData.length}件）`}
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="py-8">
              <div className="flex flex-col items-center text-center mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">インポートが完了しました</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {importSummary?.successCount ?? 0}件の企業を登録しました。
                </p>
              </div>

              {importSummary && (
                <div className="space-y-5 text-sm">
                  <div className="grid gap-2">
                    <div className="grid gap-1 text-sm text-muted-foreground text-center">
                      <span>処理対象: {importSummary.totalRows}件</span>
                      <span>新規登録: {importSummary.successCount}件 / 更新: {importSummary.companyUpdatedCount}件</span>
                      <span>役員登録: {importSummary.executiveCreatedCount}件 / 更新: {importSummary.executiveUpdatedCount}件</span>
                      <span>重複によるスキップ: {importSummary.duplicateCount}件 / エラー: {importSummary.errorItems.length}件</span>
                    </div>
                    {importSummary.missingCorporateNumberCount > 0 && (
                      <p className="text-xs text-amber-600 text-center">
                        法人番号未入力の企業が {importSummary.missingCorporateNumberCount} 件ありました。重複判定ができないため、後続で確認してください。
                      </p>
                    )}
                  </div>

                  {importSummary.errorItems.length > 0 && (
                    <div className="space-y-4">
                      {(() => {
                        const duplicateItems = importSummary.errorItems.filter((item) => item.category === "duplicate")
                        const validationItems = importSummary.errorItems.filter((item) => item.category === "validation")
                        const apiItems = importSummary.errorItems.filter((item) => item.category === "api")
                        const unknownItems = importSummary.errorItems.filter((item) => item.category === "unknown")

                        return (
                          <div className="space-y-4">
                            {duplicateItems.length > 0 && (
                              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                                <p className="font-medium text-amber-600 mb-2">
                                  法人番号の重複で登録できなかった企業（{duplicateItems.length}件）
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-amber-700">
                                  {duplicateItems.slice(0, 5).map((item, index) => (
                                    <li key={`duplicate-${item.name}-${index}`}>{item.name}: {item.message}</li>
                                  ))}
                                </ul>
                                {duplicateItems.length > 5 && (
                                  <p className="text-xs text-amber-700 mt-2">他 {duplicateItems.length - 5} 件の重複があります。</p>
                                )}
                              </div>
                            )}

                            {validationItems.length > 0 && (
                              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
                                <p className="font-medium text-destructive mb-2">
                                  入力内容の不備で登録できなかった企業（{validationItems.length}件）
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-destructive">
                                  {validationItems.slice(0, 5).map((item, index) => (
                                    <li key={`validation-${item.name}-${index}`}>{item.name}: {item.message}</li>
                                  ))}
                                </ul>
                                {validationItems.length > 5 && (
                                  <p className="text-xs text-destructive/80 mt-2">他 {validationItems.length - 5} 件の入力エラーがあります。</p>
                                )}
                              </div>
                            )}

                            {(apiItems.length > 0 || unknownItems.length > 0) && (
                              <div className="rounded-md border border-muted/40 bg-muted/10 p-4">
                                <p className="font-medium text-muted-foreground mb-2">
                                  その他のエラー（{apiItems.length + unknownItems.length}件）
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                  {[...apiItems, ...unknownItems].slice(0, 5).map((item, index) => (
                                    <li key={`other-${item.name}-${index}`}>{item.name}: {item.message}</li>
                                  ))}
                                </ul>
                                {apiItems.length + unknownItems.length > 5 && (
                                  <p className="text-xs mt-2">他 {apiItems.length + unknownItems.length - 5} 件のエラーがあります。</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <Button onClick={handleClose}>閉じる</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
