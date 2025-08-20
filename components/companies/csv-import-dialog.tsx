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
          message: error instanceof Error ? error.message : "Failed to parse CSV file",
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
          message: "Import failed. Please try again.",
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
            Import Companies from CSV
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
                  Ready to import {csvData.length} companies. This action will add new companies to your database.
                </AlertDescription>
              </Alert>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing companies...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setStep("validate")} disabled={isImporting}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? "Importing..." : `Import ${csvData.length} Companies`}
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
              <p className="text-muted-foreground mb-4">Successfully imported {csvData.length} companies.</p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
