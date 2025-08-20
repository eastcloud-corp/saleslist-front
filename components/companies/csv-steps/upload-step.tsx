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
        <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
        <p className="text-muted-foreground mb-4">Select a CSV file containing company data to import</p>

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
          Choose CSV File
        </Button>
      </div>

      <CSVTemplateDownload />

      <Alert>
        <AlertDescription>
          <strong>CSV Format Requirements:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Required columns: Company Name, Industry</li>
            <li>Optional columns: Employee Count, Revenue, Location, Website, Phone, Email, Description, Status</li>
            <li>First row should contain column headers</li>
            <li>Use UTF-8 encoding for special characters</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
