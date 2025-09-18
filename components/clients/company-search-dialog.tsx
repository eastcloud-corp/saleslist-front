"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Building2, Plus, Loader2 } from "lucide-react"
import { useCompanies } from "@/hooks/use-companies"
import { useToast } from "@/hooks/use-toast"

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
  clientId: number
}

export function CompanySearchDialog({ open, onOpenChange, onAddToNGList, clientId }: CompanySearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [ngReason, setNGReason] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const {
    companies,
    isLoading: companiesLoading,
  } = useCompanies({
    search: searchTerm,
    limit: 20,
  })

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    setNGReason("") // Reset reason when selecting a new company
  }

  const handleAddToNG = async () => {
    if (!selectedCompany) {
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
      await onAddToNGList(selectedCompany, trimmedReason || undefined)
      
      toast({
        title: "追加完了",
        description: `${selectedCompany.name}をNGリストに追加しました`,
      })

      // Reset form
      setSelectedCompany(null)
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
    setSelectedCompany(null)
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">
                検索結果 ({companies.length}件)
              </CardTitle>
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
                    {companies.map((company) => (
                      <TableRow 
                        key={company.id}
                        className={selectedCompany?.id === company.id ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50"}
                        onClick={() => handleCompanySelect(company)}
                      >
                        <TableCell>
                          <div className="flex justify-center">
                            {selectedCompany?.id === company.id && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.industry}</TableCell>
                        <TableCell>{company.prefecture}</TableCell>
                        <TableCell>
                          {company.employee_count ? `${company.employee_count}名` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Selected Company & NG Reason */}
          {selectedCompany && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">選択された企業</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{selectedCompany.name}</span>
                  <Badge variant="outline">{selectedCompany.industry}</Badge>
                  <Badge variant="outline">{selectedCompany.prefecture}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ng-reason">NG理由（任意）</Label>
                  <Input
                    id="ng-reason"
                    placeholder="例: 競合他社、既存取引先、対象外業界など"
                    value={ngReason}
                    onChange={(e) => setNGReason(e.target.value)}
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
            disabled={!selectedCompany || isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? "追加中..." : "NGリストに追加"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
