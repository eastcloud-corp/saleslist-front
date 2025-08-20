"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProjectCompany } from "@/lib/types"
import { Building2, Plus, ExternalLink, Calendar } from "lucide-react"

interface ProjectCompaniesProps {
  companies: ProjectCompany[]
  onUpdateStatus: (companyId: string, status: string, notes?: string) => Promise<void>
  onRemoveCompany: (companyId: string) => Promise<void>
  onAddCompany: () => void
  isLoading?: boolean
}

const statusOptions = [
  { value: "pending", label: "Pending", variant: "outline" as const },
  { value: "contacted", label: "Contacted", variant: "secondary" as const },
  { value: "interested", label: "Interested", variant: "default" as const },
  { value: "not_interested", label: "Not Interested", variant: "destructive" as const },
  { value: "closed", label: "Closed", variant: "default" as const },
]

export function ProjectCompanies({
  companies,
  onUpdateStatus,
  onRemoveCompany,
  onAddCompany,
  isLoading = false,
}: ProjectCompaniesProps) {
  const [editingCompany, setEditingCompany] = useState<ProjectCompany | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [newNotes, setNewNotes] = useState("")

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find((s) => s.value === status)
    return (
      <Badge variant={statusConfig?.variant || "outline"}>
        {statusConfig?.label || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleStatusUpdate = async () => {
    if (!editingCompany || !newStatus) return

    try {
      await onUpdateStatus(editingCompany.company_id, newStatus, newNotes)
      setEditingCompany(null)
      setNewStatus("")
      setNewNotes("")
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  const openEditDialog = (company: ProjectCompany) => {
    setEditingCompany(company)
    setNewStatus(company.status)
    setNewNotes(company.notes || "")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Companies ({companies.length})
          </CardTitle>
          <Button onClick={onAddCompany} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No companies added to this project yet.</p>
            <p className="text-sm">Add companies to start tracking your sales progress.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact Date</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((projectCompany) => (
                  <TableRow key={projectCompany.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{projectCompany.company.name}</div>
                        {projectCompany.company.website && (
                          <a
                            href={projectCompany.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                          >
                            {projectCompany.company.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{projectCompany.company.industry}</TableCell>
                    <TableCell>{getStatusBadge(projectCompany.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(projectCompany.contact_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(projectCompany.follow_up_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(projectCompany)}>
                          Edit
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/companies/${projectCompany.company.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Status Dialog */}
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Company Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{editingCompany?.company.name}</h4>
                <p className="text-sm text-muted-foreground">Update the status and add notes for this company.</p>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add notes about this company..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button onClick={handleStatusUpdate} disabled={isLoading}>
                  Update Status
                </Button>
                <Button variant="outline" onClick={() => setEditingCompany(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (editingCompany && confirm("Remove this company from the project?")) {
                      onRemoveCompany(editingCompany.company_id)
                      setEditingCompany(null)
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
