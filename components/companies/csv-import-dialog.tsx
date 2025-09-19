"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UploadStep } from "./csv-steps/upload-step"
import { ValidationStep } from "./csv-steps/validation-step"
import { parseCSV, validateCSVData, convertCSVToCompanyData, type CSVValidationError } from "@/lib/csv-utils"
import { Upload, CheckCircle } from "lucide-react"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (companies: any[]) => Promise<void>
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<CSVValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [step, setStep] = useState<"upload" | "validate" | "import" | "complete">("upload")

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setStep("validate")
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
    if (validationErrors.length > 0) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      const companies = convertCSVToCompanyData(csvData)

      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      await onImport(companies)
      setStep("complete")
    } catch (error) {
      console.error("Import failed:", error)
      setValidationErrors([
        {
          row: 0,
          field: "import",
          value: "",
          message: "インポート処理でエラーが発生しました。内容を確認して再度お試しください。",
        },
      ])
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
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSVから企業データをインポート
          </DialogTitle>
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
                  {csvData.length}件の企業データをインポートします。この操作により新しい企業が登録されます。
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
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">インポートが完了しました</h3>
              <p className="text-muted-foreground mb-4">{csvData.length}件の企業データを登録しました。</p>
              <Button onClick={handleClose}>閉じる</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
