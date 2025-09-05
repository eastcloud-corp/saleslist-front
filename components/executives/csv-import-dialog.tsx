"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSV, validateCSVData } from "@/lib/csv-utils"
import { apiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"
import { Upload, CheckCircle } from "lucide-react"

interface ExecutiveCSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (executives: any[]) => Promise<void>
}

export function ExecutiveCSVImportDialog({ open, onOpenChange, onImport }: ExecutiveCSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [step, setStep] = useState<"upload" | "complete">("upload")

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    processFile(selectedFile)
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setStep("complete")
    setIsProcessing(false)
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Parse CSV and use individual API calls (same as Company CSV)
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const [header, ...dataLines] = lines
      
      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',')
        const executive = {
          company_name: values[0]?.trim(),
          name: values[1]?.trim(),
          position: values[2]?.trim(),
          facebook_url: values[3]?.trim(),
          other_sns_url: values[4]?.trim(),
          direct_email: values[5]?.trim(),
          notes: values[6]?.trim()
        }
        
        if (executive.company_name && executive.name) {
          const response = await apiClient.post(API_CONFIG.ENDPOINTS.EXECUTIVES, executive)
        }
        
        setImportProgress(Math.round((i + 1) / dataLines.length * 100))
      }

      await onImport([])
      setStep("complete")
    } catch (error) {
      console.error("Import failed:", error)
    } finally {
      setIsImporting(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setIsProcessing(false)
    setIsImporting(false)
    setImportProgress(0)
    setStep("upload")
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>役員CSVインポート</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="csv-file" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        CSVファイルをアップロード
                      </span>
                    </label>
                    <input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleImport} 
                className="w-full" 
                disabled={!file || isImporting}
              >
                {isImporting ? `インポート中... ${importProgress}%` : "インポート実行"}
              </Button>
              
              {isImporting && (
                <Progress value={importProgress} className="w-full" />
              )}
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <h3 className="font-medium">インポート完了</h3>
                <p className="text-sm text-muted-foreground">
                  役員データのインポートが完了しました
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)}>
                閉じる
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}