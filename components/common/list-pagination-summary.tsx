"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export const DEFAULT_LIST_PAGE_SIZE_OPTIONS = [100, 200, 500] as const

interface ListPaginationSummaryProps {
  totalCount: number
  startItem: number
  endItem: number
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
  /** 設定時、表示件数セレクトを表示する */
  pageSize?: number
  pageSizeOptions?: readonly number[]
  onPageSizeChange?: (size: number) => void
}

export function ListPaginationSummary({
  totalCount,
  startItem,
  endItem,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  isDisabled = false,
  className,
  pageSize,
  pageSizeOptions = DEFAULT_LIST_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
}: ListPaginationSummaryProps) {
  const handlePageChange = (delta: number) => {
    if (!onPageChange) return
    const nextPage = currentPage + delta
    if (nextPage < 1 || nextPage > totalPages) return
    onPageChange(nextPage)
  }

  const showPageSize =
    typeof onPageSizeChange === "function" && typeof pageSize === "number" && pageSizeOptions.length > 0

  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {totalCount > 0 ? (
        <p>
          全 {totalCount.toLocaleString()} 件中 {startItem.toLocaleString()}件目から {endItem.toLocaleString()}件目を表示
        </p>
      ) : (
        <p>該当するデータがありません</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {showPageSize ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">表示件数</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              disabled={isDisabled || isLoading}
            >
              <SelectTrigger className="h-9 w-[100px]" aria-label="1ページあたりの表示件数">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {onPageChange ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(-1)}
                  disabled={isDisabled || currentPage === 1 || isLoading}
                >
                  前へ
                </Button>
                <span className="text-sm">
                  ページ {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={isDisabled || currentPage === totalPages || isLoading}
                >
                  次へ
                </Button>
              </>
            ) : (
              <span className="text-sm">ページ {currentPage} / {totalPages}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
