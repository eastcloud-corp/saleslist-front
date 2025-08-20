"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Executive } from "@/lib/types"
import { Plus, Edit, Trash2, ExternalLink, User } from "lucide-react"

interface ExecutiveListProps {
  executives: Executive[]
  onAdd?: (executive: Omit<Executive, "id" | "company_id" | "created_at" | "updated_at">) => void
  onEdit?: (id: string, executive: Partial<Executive>) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

export function ExecutiveList({ executives, onAdd, onEdit, onDelete, isLoading = false }: ExecutiveListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExecutive, setEditingExecutive] = useState<Executive | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
    linkedin_url: "",
    facebook_url: "",
    twitter_url: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      email: "",
      phone: "",
      linkedin_url: "",
      facebook_url: "",
      twitter_url: "",
    })
  }

  const handleAdd = () => {
    if (onAdd && formData.name && formData.position) {
      onAdd(formData)
      resetForm()
      setIsAddDialogOpen(false)
    }
  }

  const handleEdit = (executive: Executive) => {
    setEditingExecutive(executive)
    setFormData({
      name: executive.name,
      position: executive.position,
      email: executive.email,
      phone: executive.phone,
      linkedin_url: executive.linkedin_url || "",
      facebook_url: executive.facebook_url || "",
      twitter_url: executive.twitter_url || "",
    })
  }

  const handleSaveEdit = () => {
    if (onEdit && editingExecutive && formData.name && formData.position) {
      onEdit(editingExecutive.id, formData)
      resetForm()
      setEditingExecutive(null)
    }
  }

  const ExecutiveForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">氏名 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="position">役職 *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="phone">電話番号</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
          <Input
            id="linkedin_url"
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="facebook_url">Facebook URL</Label>
          <Input
            id="facebook_url"
            type="url"
            value={formData.facebook_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, facebook_url: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="twitter_url">Twitter URL</Label>
          <Input
            id="twitter_url"
            type="url"
            value={formData.twitter_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, twitter_url: e.target.value }))}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4">
        <Button onClick={isEdit ? handleSaveEdit : handleAdd} disabled={isLoading}>
          {isEdit ? "変更を保存" : "役員を追加"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetForm()
            if (isEdit) {
              setEditingExecutive(null)
            } else {
              setIsAddDialogOpen(false)
            }
          }}
          disabled={isLoading}
        >
          キャンセル
        </Button>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            役員・代表者 ({executives.length})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                役員を追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新しい役員を追加</DialogTitle>
              </DialogHeader>
              <ExecutiveForm />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {executives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>まだ役員が追加されていません。</p>
            <p className="text-sm">この企業の主要な連絡先を追跡するために役員を追加してください。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {executives.map((executive) => (
              <div key={executive.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{executive.name}</h4>
                      <Badge variant="secondary">{executive.position}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {executive.email && (
                        <div className="flex items-center gap-2">
                          <span>メール:</span>
                          <a href={`mailto:${executive.email}`} className="text-primary hover:underline">
                            {executive.email}
                          </a>
                        </div>
                      )}
                      {executive.phone && (
                        <div className="flex items-center gap-2">
                          <span>電話:</span>
                          <a href={`tel:${executive.phone}`} className="text-primary hover:underline">
                            {executive.phone}
                          </a>
                        </div>
                      )}
                      {executive.linkedin_url && (
                        <a
                          href={executive.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          LinkedIn <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {executive.facebook_url && (
                        <a
                          href={executive.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Facebook <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {executive.twitter_url && (
                        <a
                          href={executive.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Twitter <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(executive)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    {onDelete && (
                      <Button variant="outline" size="sm" onClick={() => onDelete(executive.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingExecutive} onOpenChange={() => setEditingExecutive(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>役員を編集</DialogTitle>
            </DialogHeader>
            <ExecutiveForm isEdit />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
