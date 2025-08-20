"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadCSV, CSV_HEADER_LABELS, CSV_HEADERS } from "@/lib/csv-utils"
import { Download, FileText } from "lucide-react"

export function CSVTemplateDownload() {
  const handleDownloadTemplate = () => {
    // Create sample CSV template with headers and example data
    const headers = CSV_HEADERS.map((header) => CSV_HEADER_LABELS[header]).join(",")
    const sampleData = [
      "Tech Solutions Inc.,Technology,150,5000000,Tokyo Japan,https://techsolutions.com,+81-3-1234-5678,contact@techsolutions.com,Leading technology solutions provider,active",
      "Global Manufacturing Co.,Manufacturing,500,25000000,Osaka Japan,https://globalmanufacturing.com,+81-6-9876-5432,info@globalmanufacturing.com,International manufacturing company,prospect",
    ]

    const csvContent = [headers, ...sampleData].join("\n")
    downloadCSV(csvContent, "company-import-template.csv")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSV Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Download a CSV template with the correct format and sample data to help you prepare your company import file.
        </p>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </CardContent>
    </Card>
  )
}
