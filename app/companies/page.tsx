"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { CompanyFilters } from "@/components/companies/company-filters"
import { CompanyTable } from "@/components/companies/company-table"
import { CSVImportDialog } from "@/components/companies/csv-import-dialog"
import type { ImportErrorItem } from "@/components/companies/csv-import-dialog"
import { useCompanies } from "@/hooks/use-companies"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { exportCompaniesToCSV, downloadCSV } from "@/lib/csv-utils"
import { API_CONFIG } from "@/lib/api-config"
import { apiClient, ApiError } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import type { CompanyFilter as CompanyFiltersType, CompanyReviewBatch } from "@/lib/types"
import { Download, Plus, Upload, Database, Building2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AddToProjectDialog } from "@/components/companies/add-to-project-dialog"
import { ListPaginationSummary } from "@/components/common/list-pagination-summary"
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
  const [isCorporateSummaryLoading, setIsCorporateSummaryLoading] = useState(true)
  const [corporateSummaryError, setCorporateSummaryError] = useState<string | null>(null)
  const [corporateReviewSummary, setCorporateReviewSummary] = useState<{
    pendingItems: number
    batchCount: number
  } | null>(null)

  const fetchCorporateReviewSummary = useCallback(async () => {
    setIsCorporateSummaryLoading(true)
    setCorporateSummaryError(null)
    try {
      const params = new URLSearchParams({ field: "corporate_number", status: "pending" })
      const endpoint = `${API_CONFIG.ENDPOINTS.COMPANY_REVIEW_BATCHES}?${params.toString()}`
      type ReviewResponse = { results?: CompanyReviewBatch[] } | CompanyReviewBatch[]
      const data = await apiClient.get<ReviewResponse>(endpoint)
      const maybeResults = (data as { results?: CompanyReviewBatch[] })?.results
      const batches: CompanyReviewBatch[] = Array.isArray(data)
        ? data
        : Array.isArray(maybeResults)
          ? maybeResults
          : []
      const pendingItems = batches.reduce((sum, batch) => sum + (batch.pending_items ?? 0), 0)
      setCorporateReviewSummary({
        pendingItems,
        batchCount: batches.length,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "自動取得レビュー状況の取得に失敗しました"
      console.error("[companies] failed to load corporate review summary", err)
      setCorporateSummaryError(message)
      setCorporateReviewSummary(null)
    } finally {
      setIsCorporateSummaryLoading(false)
    }
  }, [])

  const refreshCompanies = useCallback(async () => {
    await refetch()
    await fetchCorporateReviewSummary()
  }, [refetch, fetchCorporateReviewSummary])

  const isAdmin = user?.role === 'admin'

  const totalCount = pagination?.total ?? companies.length
  const pageSize = pagination?.limit ?? (companies.length || 1)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount)
  const totalPages = pagination?.total_pages ?? (pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1)

  useEffect(() => {
    setSelectedCompanyIds((prev) => prev.filter((id) => companies.some((company) => company.id === id)))
  }, [companies])

  useEffect(() => {
    fetchCorporateReviewSummary()
  }, [fetchCorporateReviewSummary])

  const selectedCompanySet = useMemo(() => new Set(selectedCompanyIds), [selectedCompanyIds])
  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanySet.has(company.id)),
    [companies, selectedCompanySet]
  )

  // Auto-refresh when returning from company creation
  useEffect(() => {
    if (searchParams?.get('refresh') === 'true') {
      console.log("[v0] Auto-refreshing companies list after creation")
      refreshCompanies()
      // Clean up URL parameter
      window.history.replaceState(null, '', '/companies')
    }
  }, [searchParams, refreshCompanies])

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

      void refreshCompanies()
    },
    [refreshCompanies, router, toast]
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

  const handleImport = async (
    file: File,
    context: { rowCount: number },
    onProgress: (progress: number) => void,
  ) => {
    if (context.rowCount === 0) {
      onProgress(100)
      return {
        successCount: 0,
        companyUpdatedCount: 0,
        executiveCreatedCount: 0,
        executiveUpdatedCount: 0,
        errorItems: [],
        missingCorporateNumberCount: 0,
        duplicateCount: 0,
        totalRows: 0,
      }
    }

    onProgress(5)
    try {
      const response = await apiClient.uploadFile<{
        message?: string
        imported_count: number
        company_updated_count: number
        total_rows?: number
        duplicate_count: number
        duplicates?: Array<{ row?: number; name?: string; reason?: string; type?: string; corporate_number?: string }>
        missing_corporate_number_count: number
        executive_created_count: number
        executive_updated_count: number
      }>(API_CONFIG.ENDPOINTS.COMPANY_IMPORT_CSV, file)

      onProgress(90)

      const duplicates = Array.isArray(response.duplicates) ? response.duplicates : []
      const duplicateItems: ImportErrorItem[] = duplicates.slice(0, 50).map((item) => {
        const name = item.name || (item.corporate_number ? `法人番号 ${item.corporate_number}` : `行${item.row ?? '?'}`)
        return {
          name,
          message: item.reason || '重複のため登録できませんでした',
          category: 'duplicate',
        }
      })

      const summary = {
        successCount: response.imported_count ?? 0,
        companyUpdatedCount: response.company_updated_count ?? 0,
        executiveCreatedCount: response.executive_created_count ?? 0,
        executiveUpdatedCount: response.executive_updated_count ?? 0,
        errorItems: duplicateItems,
        missingCorporateNumberCount: response.missing_corporate_number_count ?? 0,
        duplicateCount: response.duplicate_count ?? duplicateItems.length,
        totalRows: response.total_rows ?? context.rowCount,
      }

      onProgress(100)

      toast({
        title: 'CSVのインポートが完了しました',
        description: `${summary.successCount}件を登録、${summary.companyUpdatedCount}件を更新しました。` +
          (summary.duplicateCount ? ` 重複によるスキップ: ${summary.duplicateCount}件。` : ''),
      })

      await refreshCompanies()

      return summary
    } catch (error) {
      console.error('[companies/import] failed', error)
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
            <Button asChild variant="secondary" className="flex items-center gap-2">
              <Link href="/companies/reviews?field=corporate_number&status=pending">
                <Building2 className="h-4 w-4" />
                会社情報自動取得レビュー
                <span className="ml-1 flex items-center gap-1">
                  {isCorporateSummaryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : corporateSummaryError ? (
                    <Badge variant="destructive" className="pointer-events-none">
                      取得失敗
                    </Badge>
                  ) : (
                    <Badge
                      variant={(corporateReviewSummary?.pendingItems ?? 0) > 0 ? "destructive" : "outline"}
                      className="pointer-events-none"
                    >
                      未レビュー {corporateReviewSummary?.pendingItems ?? 0}
                    </Badge>
                  )}
                </span>
              </Link>
            </Button>
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
        <CompanyFilters
          filters={pendingFilters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
          filtersChanged={filtersChanged}
          hasAppliedFilters={hasAppliedFilters}
        />

        {/* Selection actions */}
        <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <ListPaginationSummary
          totalCount={totalCount}
          startItem={startItem}
          endItem={endItem}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          isLoading={isLoading}
        />

        {/* Company Table */}
        <CompanyTable
          companies={companies}
          isLoading={isLoading}
          onRefresh={refreshCompanies}
          selectable
          selectedIds={selectedCompanyIds}
          onSelectChange={handleSelectChange}
          onSelectAllChange={handleSelectAllChange}
          onAddToProject={handleInlineAdd}
          totalCount={totalCount}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <ListPaginationSummary
            totalCount={totalCount}
            startItem={startItem}
            endItem={endItem}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            isLoading={isLoading}
          />
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
