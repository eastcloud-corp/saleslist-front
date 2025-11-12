"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Building2, Plus, Loader2, X } from "lucide-react"
import { useCompanies } from "@/hooks/use-companies"
import { useToast } from "@/hooks/use-toast"
import type { CheckedState } from "@radix-ui/react-checkbox"

interface Company {
  id: number
  name: string
  industry: string
  prefecture: string
  employee_count?: number
}

interface CompanySearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToNGList: (company: Company, reason?: string) => Promise<void>
  onAddCompaniesToNG?: (companyIds: number[], reason?: string) => Promise<void>
  clientId: number
}

export function CompanySearchDialog({ open, onOpenChange, onAddToNGList, onAddCompaniesToNG, clientId }: CompanySearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [ngReason, setNGReason] = useState("")
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const {
    companies,
    isLoading: companiesLoading,
  } = useCompanies({
    search: searchTerm,
    limit: 20,
  })

  const handleCompanyToggle = (companyId: number, checked: CheckedState) => {
    const newSelected = new Set(selectedCompanies)
    if (checked === true) {
      newSelected.add(companyId)
    } else {
      newSelected.delete(companyId)
    }
    setSelectedCompanies(newSelected)
  }

  const handleSelectAll = (checked: CheckedState) => {
    if (checked === true) {
      const allIds = new Set(companies.map((c: Company) => c.id))
      setSelectedCompanies(allIds)
    } else {
      setSelectedCompanies(new Set())
    }
  }

  const handleRemoveSelection = (companyId: number) => {
    const newSelected = new Set(selectedCompanies)
    newSelected.delete(companyId)
    setSelectedCompanies(newSelected)
  }

  const handleAddToNG = async () => {
    if (selectedCompanies.size === 0) {
      toast({
        title: "エラー",
        description: "企業を選択してください",
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)
    try {
      const trimmedReason = ngReason.trim()
      const companyIds = Array.from(selectedCompanies)
      
      // 複数選択の場合は一括追加APIを使用
      if (companyIds.length === 1) {
        // 単一選択の場合は既存のメソッドを使用（後方互換性）
        const company = companies.find((c: Company) => c.id === companyIds[0])
        if (company) {
          await onAddToNGList(company, trimmedReason || undefined)
          toast({
            title: "追加完了",
            description: `${company.name}をNGリストに追加しました`,
          })
        }
      } else {
        // 複数選択の場合は新しい一括追加APIを使用
        if (onAddCompaniesToNG) {
          // 親コンポーネントでトーストメッセージを表示するため、ここでは表示しない
          await onAddCompaniesToNG(companyIds as number[], trimmedReason || undefined)
        } else {
          // フォールバック: 1社ずつ追加
          for (const companyId of companyIds) {
            const company = companies.find((c: Company) => c.id === companyId)
            if (company) {
              await onAddToNGList(company, trimmedReason || undefined)
            }
          }
          toast({
            title: "追加完了",
            description: `${companyIds.length}社をNGリストに追加しました`,
          })
        }
      }

      // Reset form
      setSelectedCompanies(new Set())
      setNGReason("")
      setSearchTerm("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "エラー",
        description: "NGリストへの追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setSelectedCompanies(new Set())
    setNGReason("")
    setSearchTerm("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            企業検索からNG企業追加
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            企業を検索し、NG 登録する企業を選択して理由を入力します。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">企業名で検索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="企業名を入力してください..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  検索結果 ({companies.length}件)
                </CardTitle>
                {companies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={companies.length > 0 && companies.every((c: Company) => selectedCompanies.has(c.id))}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label className="text-sm text-muted-foreground cursor-pointer">
                      すべて選択
                    </Label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[320px]">
              {companiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  検索中...
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "該当する企業が見つかりません" : "企業情報が登録されていません"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">選択</TableHead>
                      <TableHead>企業名</TableHead>
                      <TableHead>業界</TableHead>
                      <TableHead>所在地</TableHead>
                      <TableHead>従業員数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company: Company) => {
                      const isSelected = selectedCompanies.has(company.id)
                      return (
                        <TableRow 
                          key={company.id}
                          className={isSelected ? "bg-blue-50" : "hover:bg-gray-50 cursor-pointer"}
                          onClick={() => {
                            handleCompanyToggle(company.id, !isSelected)
                          }}
                        >
                          <TableCell className="w-[48px]">
                            <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Checkbox
                                aria-label={`企業を選択: ${company.name}`}
                                checked={isSelected}
                                onCheckedChange={(checked: CheckedState) => {
                                  handleCompanyToggle(company.id, checked)
                                }}
                              />
                            </div>
                          </TableCell>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.industry}</TableCell>
                        <TableCell>{company.prefecture}</TableCell>
                        <TableCell>
                          {company.employee_count ? `${company.employee_count}名` : "-"}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Selected Companies & NG Reason */}
          {selectedCompanies.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  選択された企業 ({selectedCompanies.size}社)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {companies
                    .filter((c: Company) => selectedCompanies.has(c.id))
                    .map((company: Company) => (
                      <div key={company.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{company.name}</span>
                          <Badge variant="outline" className="text-xs">{company.industry}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSelection(company.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ng-reason">NG理由（任意）</Label>
                  <Input
                    id="ng-reason"
                    placeholder="例: 競合他社、既存取引先、対象外業界など"
                    value={ngReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNGReason(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {ngReason.length}/100文字
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            キャンセル
          </Button>
          <Button 
            onClick={handleAddToNG} 
            disabled={selectedCompanies.size === 0 || isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? "追加中..." : `NGリストに追加 (${selectedCompanies.size}社)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
