"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { CompanyFilters } from "@/components/companies/company-filters"
import { CompanyTable } from "@/components/companies/company-table"
import { CSVImportDialog } from "@/components/companies/csv-import-dialog"
import { useCompanies } from "@/hooks/use-companies"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { exportCompaniesToCSV, downloadCSV } from "@/lib/csv-utils"
import { apiClient, API_CONFIG } from "@/lib/api-config"
import { useAuth } from "@/hooks/use-auth"
import type { CompanyFilter as CompanyFiltersType } from "@/lib/types"
import { Download, Plus, Upload, ArrowLeft, Database } from "lucide-react"
import Link from "next/link"

export default function CompaniesPage() {
  const [filters, setFilters] = useState<CompanyFiltersType>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { user } = useAuth()
  const { companies, pagination, isLoading, error, refetch } = useCompanies(filters, currentPage, 100)
  
  const isAdmin = user?.role === 'admin'

  const handleFiltersChange = (newFilters: CompanyFiltersType) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csvContent = exportCompaniesToCSV(companies)
      const timestamp = new Date().toISOString().split("T")[0]
      downloadCSV(csvContent, `companies-export-${timestamp}.csv`)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (importedCompanies: any[]) => {
    try {
      console.log("Importing companies:", importedCompanies)
      
      // Use individual company creation API
      for (const company of importedCompanies) {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.COMPANIES, company)
        if (!response.ok) {
          throw new Error(`Failed to import: ${company.name}`)
        }
      }
      
      await refetch()
    } catch (error) {
      console.error("Import failed:", error)
      throw error
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6 text-gray-600" />
                <h1 className="text-3xl font-bold">企業データベース管理</h1>
                <Badge variant="secondary">管理画面</Badge>
              </div>
              <p className="text-muted-foreground mt-1">営業対象企業のマスターデータを管理・メンテナンス</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "エクスポート中..." : "CSV エクスポート"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              CSV インポート
            </Button>
            <Button asChild>
              <Link href="/companies/new">
                <Plus className="h-4 w-4 mr-2" />
                企業追加
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <CompanyFilters filters={filters} onFiltersChange={handleFiltersChange} onClearFilters={handleClearFilters} />

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Company Table */}
        <CompanyTable companies={companies} isLoading={isLoading} onRefresh={refetch} />

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination.total}件中 {(currentPage - 1) * pagination.limit + 1}件目から{" "}
              {Math.min(currentPage * pagination.limit, pagination.total)}件目を表示
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                前へ
              </Button>
              <span className="text-sm">
                {currentPage} / {pagination.total_pages} ページ
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.total_pages}
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* CSV Import Dialog */}
        <CSVImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} onImport={handleImport} />
      </div>
    </MainLayout>
  )
}
