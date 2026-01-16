"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCompanies } from "@/hooks/use-companies"
import { Search, Building2, Loader2, AlertTriangle, ExternalLink } from "lucide-react"

const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "-"
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount)
}

const getStatusBadge = (status?: string) => {
  const variants = {
    active: "default",
    prospect: "secondary",
    inactive: "outline",
  } as const

  const statusLabels = {
    active: "アクティブ",
    prospect: "見込み客",
    inactive: "非アクティブ",
  } as const

  const statusValue = status || "active"
  return (
    <Badge variant={variants[statusValue as keyof typeof variants] || "outline"}>
      {statusLabels[statusValue as keyof typeof statusLabels] || statusValue}
    </Badge>
  )
}

interface AddCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCompanies: (companyIds: string[]) => Promise<void>
  existingCompanyIds: string[]
  clientId?: string
}

export function AddCompanyDialog({
  open,
  onOpenChange,
  onAddCompanies,
  existingCompanyIds,
  clientId,
}: AddCompanyDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)

  const { companies, isLoading, error } = useCompanies({
    search: searchTerm,
    limit: 50,
  })

  const availableCompanies = companies.filter((company) => !existingCompanyIds.includes(company.id.toString()))

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId],
    )
  }

  const handleAddCompanies = async () => {
    if (selectedCompanyIds.length === 0) return

    setIsAdding(true)
    try {
      await onAddCompanies(selectedCompanyIds)
      setSelectedCompanyIds([])
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to add companies:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setSelectedCompanyIds([])
    setSearchTerm("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            案件に企業を追加
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            企業を検索してチェックし、案件に追加する企業を確定してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="企業名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          {selectedCompanyIds.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{selectedCompanyIds.length}社が選択されています</AlertDescription>
            </Alert>
          )}

          {/* Companies list */}
          <div className="flex-1 overflow-auto border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                企業を検索中...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2" />
                企業の取得に失敗しました
              </div>
            ) : availableCompanies.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-center">
                  <p>追加可能な企業が見つかりません</p>
                  <p className="text-sm">検索条件を変更してください</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">選択</TableHead>
                    <TableHead className="max-w-[250px]">企業名</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>Facebook</TableHead>
                    <TableHead>業界</TableHead>
                    <TableHead>従業員数</TableHead>
                    <TableHead>売上</TableHead>
                    <TableHead>所在地</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCompanyIds.includes(company.id.toString())}
                          onCheckedChange={() => handleCompanyToggle(company.id.toString())}
                        />
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate">
                          <div className="font-medium truncate">{company.name}</div>
                          {company.website && (
                            <div className="text-xs text-muted-foreground">
                              {company.website.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.contact_person_name ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{company.contact_person_name}</p>
                            {company.contact_person_position && (
                              <p className="text-xs text-muted-foreground">{company.contact_person_position}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">未設定</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.facebook_url ? (
                          <a
                            href={company.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Facebook
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">未設定</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.industry}</Badge>
                      </TableCell>
                      <TableCell>{company.employee_count || "-"}</TableCell>
                      <TableCell>{formatCurrency(company.revenue)}</TableCell>
                      <TableCell>{company.prefecture || "-"}</TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {availableCompanies.length}社中 {selectedCompanyIds.length}社を選択
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button onClick={handleAddCompanies} disabled={selectedCompanyIds.length === 0 || isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    追加中...
                  </>
                ) : (
                  `${selectedCompanyIds.length}社を追加`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
