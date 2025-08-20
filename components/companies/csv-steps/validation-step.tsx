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
        <LoadingSpinner text="Processing CSV file..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <span className="font-medium">{file.name}</span>
        <Badge variant="outline">{csvData.length} rows</Badge>
      </div>

      {validationErrors.length > 0 ? (
        <ErrorAlert
          title={`${validationErrors.length} validation error(s) found`}
          message="Please fix the following issues before importing:"
          errors={validationErrors
            .slice(0, 10)
            .map((error) => `Row ${error.row}: ${error.message} (${error.field}: "${error.value}")`)}
        />
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            CSV file validated successfully. Ready to import {csvData.length} companies.
          </AlertDescription>
        </Alert>
      )}

      {csvData.length > 0 && (
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h4 className="font-medium">Data Preview (first 5 rows)</h4>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Location</TableHead>
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
          Cancel
        </Button>
        {validationErrors.length === 0 && <Button onClick={onContinue}>Continue to Import</Button>}
      </div>
    </div>
  )
}
