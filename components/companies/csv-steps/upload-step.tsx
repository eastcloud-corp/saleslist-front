"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CSVTemplateDownload } from "../csv-template-download"
import { Upload, FileText } from "lucide-react"

interface UploadStepProps {
  onFileSelect: (file: File) => void
}

export function UploadStep({ onFileSelect }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">インポートするCSVファイルを選択</h3>
        <p className="text-muted-foreground mb-4">企業データを含むCSVファイルをアップロードしてください</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
          className="hidden"
        />

        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          CSVファイルを選択
        </Button>
      </div>

      <CSVTemplateDownload />

      <Alert>
        <AlertDescription>
          <strong>CSVの書式について</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>ヘッダー（1行目）は英語のまま変更しないでください（例: Company Name, Industry）。</li>
            <li>必須列：Company Name（企業名）、Industry（業種）</li>
            <li>任意列：Employee Count、Revenue、Prefecture、City、Location、Website URL、Phone、Email、Business Description</li>
            <li>ファイルは UTF-8 で保存してください。</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
