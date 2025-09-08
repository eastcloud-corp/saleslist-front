"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/types"

// Temporary type definitions (should be moved to proper types file)
type EnhancedProject = Project
type ProjectEditData = Partial<Project>
type ProgressStatus = {id: number, name: string}

interface EditableCellProps {
  project: EnhancedProject
  field: keyof ProjectEditData
  isEditing: boolean
  editData: ProjectEditData
  setEditData: (data: ProjectEditData) => void
  progressStatuses?: ProgressStatus[]
}

export function CheckboxCell({ project, field, isEditing, editData, setEditData }: EditableCellProps) {
  if (!isEditing) {
    return (
      <div className="flex items-center justify-center">
        <Checkbox checked={project[field] as boolean} disabled />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={editData[field] as boolean}
        onCheckedChange={(checked) =>
          setEditData({ ...editData, [field]: checked })
        }
      />
    </div>
  )
}

export function NumberCell({ project, field, isEditing, editData, setEditData }: EditableCellProps) {
  if (!isEditing) {
    return <div className="text-center">{project[field] as number}</div>
  }

  return (
    <Input
      type="number"
      value={editData[field] as number}
      onChange={(e) =>
        setEditData({ ...editData, [field]: parseInt(e.target.value) || 0 })
      }
      className="w-20 text-center"
    />
  )
}

export function TextCell({ project, field, isEditing, editData, setEditData }: EditableCellProps) {
  if (!isEditing) {
    return <div className="max-w-xs truncate">{(project[field] as string) || '-'}</div>
  }

  return (
    <Input
      value={(editData[field] as string) || ''}
      onChange={(e) =>
        setEditData({ ...editData, [field]: e.target.value })
      }
      className="min-w-0"
    />
  )
}

export function TextareaCell({ project, field, isEditing, editData, setEditData }: EditableCellProps) {
  if (!isEditing) {
    return <div className="max-w-xs truncate">{(project[field] as string) || '-'}</div>
  }

  return (
    <Textarea
      value={(editData[field] as string) || ''}
      onChange={(e) =>
        setEditData({ ...editData, [field]: e.target.value })
      }
      className="min-w-0 resize-none"
      rows={2}
    />
  )
}

interface ProgressStatusCellProps {
  project: EnhancedProject
  isEditing: boolean
  editData: ProjectEditData
  setEditData: (data: ProjectEditData) => void
  progressStatuses: ProgressStatus[]
}

export function ProgressStatusCell({ 
  project, 
  isEditing, 
  editData, 
  setEditData, 
  progressStatuses 
}: ProgressStatusCellProps) {
  if (!isEditing) {
    return (
      <Badge variant="outline">
        {project.progress_status || '未設定'}
      </Badge>
    )
  }

  return (
    <Select
      value={editData.progress_status_id?.toString() || ''}
      onValueChange={(value) =>
        setEditData({ ...editData, progress_status_id: parseInt(value) })
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="進行状況を選択" />
      </SelectTrigger>
      <SelectContent>
        {progressStatuses.map((status) => (
          <SelectItem key={status.id} value={status.id.toString()}>
            {status.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}