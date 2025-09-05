"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import { Upload, CheckCircle } from "lucide-react"

interface ProjectCSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (projects: any[]) => Promise<void>
}

export function ProjectCSVImportDialog({ open, onOpenChange, onImport }: ProjectCSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [step, setStep] = useState<"upload" | "complete">("upload")

  const handleImport = async () => {
    if (!file) return
    setIsImporting(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const [header, ...dataLines] = lines
      
      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',')
        const project = {
          name: values[0]?.trim(),
          client_company: values[1]?.trim(),
          description: values[2]?.trim(),
          manager_name: values[3]?.trim(),
          status: values[4]?.trim() || 'planning'
        }
        
        if (project.name) {
          await apiClient.post(API_CONFIG.ENDPOINTS.PROJECTS, project)
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
          <DialogTitle>案件CSVインポート</DialogTitle>
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
                        if (file) {
                          setFile(file)
                          handleFileSelect(file)
                        }
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
                  案件データのインポートが完了しました
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