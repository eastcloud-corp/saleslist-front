"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { ExecutiveCSVImportDialog } from "@/components/executives/csv-import-dialog"
import { Upload } from "lucide-react"

export default function ExecutivesPage() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const handleImport = async (executives: any[]) => {
    // Import処理は既にダイアログ内で完了
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">役員管理</h1>
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            CSVインポート
          </Button>
        </div>

        <ExecutiveCSVImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImport}
        />
      </div>
    </MainLayout>
  )
}