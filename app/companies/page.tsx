"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
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
import { Download, Plus, Upload, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AddToProjectDialog } from "@/components/companies/add-to-project-dialog"
import Link from "next/link"

function CompaniesPageContent() {
  const [pendingFilters, setPendingFilters] = useState<CompanyFiltersType>({})
  const [appliedFilters, setAppliedFilters] = useState<CompanyFiltersType>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const searchParams = useSearchParams()
  const { user } = useAuth()
  const filtersChanged = useMemo(
    () => JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters),
    [pendingFilters, appliedFilters]
  )
  const hasAppliedFilters = useMemo(
    () => Object.values(appliedFilters).some((value) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ""
    ),
    [appliedFilters]
  )
  const { companies, pagination, isLoading, error, refetch } = useCompanies(appliedFilters, currentPage, 100)
  const { toast } = useToast()
  const router = useRouter()

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setSelectedCompanyIds((prev) => prev.filter((id) => companies.some((company) => company.id === id)))
  }, [companies])

  const selectedCompanySet = useMemo(() => new Set(selectedCompanyIds), [selectedCompanyIds])
  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanySet.has(company.id)),
    [companies, selectedCompanySet]
  )

  // Auto-refresh when returning from company creation
  useEffect(() => {
    if (searchParams?.get('refresh') === 'true') {
      console.log("[v0] Auto-refreshing companies list after creation")
      refetch()
      // Clean up URL parameter
      window.history.replaceState(null, '', '/companies')
    }
  }, [searchParams, refetch])

  const handleFiltersChange = (newFilters: CompanyFiltersType) => {
    setPendingFilters(newFilters)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(JSON.parse(JSON.stringify(pendingFilters)) as CompanyFiltersType)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setPendingFilters({})
    setAppliedFilters({})
    setCurrentPage(1)
  }

  const handleSelectChange = useCallback((companyId: number, selected: boolean) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(companyId)
      } else {
        next.delete(companyId)
      }
      return Array.from(next)
    })
  }, [])

  const handleSelectAllChange = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedCompanyIds(companies.map((company) => company.id))
    } else {
      setSelectedCompanyIds([])
    }
  }, [companies])

  const handleInlineAdd = useCallback(
    (company: typeof companies[number]) => {
      setSelectedCompanyIds([company.id])
      setIsAddDialogOpen(true)
    },
    []
  )

  const handleAddCompleted = useCallback(
    (results: Array<{ projectId: number; projectName: string; addedCount: number; errors: string[] }>) => {
      setIsAddDialogOpen(false)
      setSelectedCompanyIds([])

      const totalAdded = results.reduce((sum, item) => sum + (item.addedCount ?? 0), 0)
      const totalErrors = results.reduce((sum, item) => sum + (item.errors?.length ?? 0), 0)
      const targetLabel = results.length === 1 ? results[0].projectName : `${results.length}件の案件`

      toast({
        title: '案件に追加しました',
        description:
          totalErrors > 0
            ? `${targetLabel} に ${totalAdded}社を追加。${totalErrors}件は除外されました。`
            : `${targetLabel} に ${totalAdded}社を追加しました。`,
      })

      if (results.length === 1 && results[0].addedCount > 0) {
        router.push(`/projects/${results[0].projectId}`)
      }

      refetch()
    },
    [refetch, router, toast]
  )

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
            <Button
              variant="outline"
              disabled={companies.length === 0}
              onClick={() => setSelectedCompanyIds(companies.map((company) => company.id))}
            >
              表示中を全選択
            </Button>
            <Button
              variant="outline"
              disabled={selectedCompanyIds.length === 0}
              onClick={() => setSelectedCompanyIds([])}
            >
              選択を解除
            </Button>
            <Button
              variant="default"
              disabled={selectedCompanyIds.length === 0}
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              案件に追加
            </Button>
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
        <CompanyFilters
          filters={pendingFilters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
          filtersChanged={filtersChanged}
          hasAppliedFilters={hasAppliedFilters}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Company Table */}
        <CompanyTable
          companies={companies}
          isLoading={isLoading}
          onRefresh={refetch}
          selectable
          selectedIds={selectedCompanyIds}
          onSelectChange={handleSelectChange}
          onSelectAllChange={handleSelectAllChange}
          onAddToProject={handleInlineAdd}
        />

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

        <AddToProjectDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setSelectedCompanyIds([])
            }
          }}
          companies={selectedCompanies}
          onCompleted={handleAddCompleted}
        />
      </div>
    </MainLayout>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <CompaniesPageContent />
    </Suspense>
  )
}
