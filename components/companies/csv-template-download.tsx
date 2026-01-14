"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadCSV, CSV_HEADERS, CSV_HEADER_LABELS } from "@/lib/csv-utils"
import { Download, FileText } from "lucide-react"

export function CSVTemplateDownload() {
  const handleDownloadTemplate = () => {
    // Create sample CSV template with Japanese headers and example data
    const headers = CSV_HEADERS.map((header) => CSV_HEADER_LABELS[header]).join(",")
    const sampleData = [
      "田中太郎,株式会社テックワークス,部長,https://techworks.example.com,IT,1234567890123,150,50000000,東京都千代田区丸の内1-1-1,https://www.facebook.com/techworks,03-1234-5678,info@techworks.example.com,クラウド型営業支援サービス,active",
      "鈴木花子,有限会社グリーンライフ,課長,http://greenlife.example.jp,ヘルスケア,9876543210987,45,12000000,大阪府大阪市北区梅田1-2-3,https://www.facebook.com/greenlife,06-9876-5432,contact@greenlife.example.jp,健康食品の製造・販売,prospect",
    ]

    const csvContent = [headers, ...sampleData].join("\n")
    downloadCSV(csvContent, "company-import-template.csv")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSVテンプレート
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          正しい列構成とサンプルデータを含むテンプレートをダウンロードできます。ヘッダー（1行目）は英語のままご利用ください。
        </p>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          テンプレートをダウンロード
        </Button>
      </CardContent>
    </Card>
  )
}
