"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
}: ListPaginationSummaryProps) {
  const handlePageChange = (delta: number) => {
    if (!onPageChange) return
    const nextPage = currentPage + delta
    if (nextPage < 1 || nextPage > totalPages) return
    onPageChange(nextPage)
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
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
  )
}
