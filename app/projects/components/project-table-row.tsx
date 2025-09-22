"use client"

import Link from "next/link"
import { memo, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { CheckedState } from "@radix-ui/react-checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import type { Project } from "@/lib/types"

type LookupOption = { id: number; name: string }

export type ProjectTableRowProps = {
  project: Project
  editMode: boolean
  isPending: boolean
  pendingChanges?: Partial<Project>
  progressStatuses: LookupOption[]
  serviceTypes: LookupOption[]
  meetingStatuses: LookupOption[]
  mediaTypes: LookupOption[]
  listImportSources: LookupOption[]
  listAvailabilities: LookupOption[]
  onFieldChange: (projectId: number, changes: Partial<Project>) => void
  onOpenHistory: (project: Project) => void
}

type IntegerSelectField =
  | "progress_status_id"
  | "service_type_id"
  | "media_type_id"
  | "regular_meeting_status_id"
  | "list_availability_id"
  | "list_import_source_id"

export const STICKY_PROJECT_WIDTH = 200
const STICKY_CLIENT_OFFSET = `${STICKY_PROJECT_WIDTH}px`

const formatDate = (value?: string | null) => {
  if (!value) return "未設定"
  return new Date(value).toLocaleDateString("ja-JP")
}

const ProjectTableRow = memo<ProjectTableRowProps>(
  ({
    project,
    editMode,
    isPending,
    pendingChanges = {},
    progressStatuses,
    serviceTypes,
    meetingStatuses,
    mediaTypes,
    listImportSources,
    listAvailabilities,
    onFieldChange,
    onOpenHistory,
  }) => {
    const projectId = Number(project.id)

    const getPendingValue = <T extends keyof Project>(field: T, fallback: Project[T]) => {
      const pending = pendingChanges[field]
      return (pending !== undefined ? pending : fallback) as Project[T]
    }

    const handleIntegerSelectChange = (field: IntegerSelectField, value: string) => {
      if (value === "debug") return
      const numeric = value ? Number.parseInt(value, 10) : undefined
      const original = (project as Record<string, unknown>)[field]
      const cleanValue = numeric === undefined || numeric === original ? undefined : numeric
      onFieldChange(projectId, { [field]: cleanValue } as Partial<Project>)
    }

    const handleNumberChange = (field: keyof Project, value: string) => {
      const numeric = Number.parseInt(value, 10) || 0
      const original = (project as Record<string, unknown>)[field]
      const cleanValue = numeric === original ? undefined : numeric
      onFieldChange(projectId, { [field]: cleanValue } as Partial<Project>)
    }

    const handleBooleanChange = (
      field: "director_login_available" | "operator_group_invited",
      checked: CheckedState,
    ) => {
      const nextValue = checked === true
      const original = Boolean((project as Record<string, unknown>)[field])
      const cleanValue = nextValue === original ? undefined : nextValue
      onFieldChange(projectId, { [field]: cleanValue } as Partial<Project>)
    }

    const handleTextChange = (field: keyof Project, value: string) => {
      const original = (project as Record<string, unknown>)[field]
      const cleanValue = value === (original ?? "") ? undefined : value
      onFieldChange(projectId, { [field]: cleanValue } as Partial<Project>)
    }

    const progressStatusValue = useMemo(() => {
      const pending = pendingChanges.progress_status_id
      if (pending !== undefined) {
        return pending == null ? "" : String(pending)
      }
      return project.progress_status_id != null ? String(project.progress_status_id) : ""
    }, [pendingChanges.progress_status_id, project.progress_status_id])

    const serviceTypeValue = useMemo(() => {
      const pending = pendingChanges.service_type_id
      if (pending !== undefined) {
        return pending == null ? "" : String(pending)
      }
      return project.service_type_id != null ? String(project.service_type_id) : ""
    }, [pendingChanges.service_type_id, project.service_type_id])

    const mediaTypeValue = useMemo(() => {
      const pending = pendingChanges.media_type_id
      if (pending !== undefined) {
        return pending == null ? "" : String(pending)
      }
      return project.media_type_id != null ? String(project.media_type_id) : ""
    }, [pendingChanges.media_type_id, project.media_type_id])

    const regularMeetingStatusValue = useMemo(() => {
      const pending = pendingChanges.regular_meeting_status_id
      if (pending !== undefined) {
        return pending == null ? "" : String(pending)
      }
      return project.regular_meeting_status_id != null ? String(project.regular_meeting_status_id) : ""
    }, [pendingChanges.regular_meeting_status_id, project.regular_meeting_status_id])

    const listAvailabilityValue = useMemo(() => {
      const pending = pendingChanges.list_availability_id
      if (pending !== undefined) {
        return pending == null ? "" : String(pending)
      }
      return project.list_availability_id != null ? String(project.list_availability_id) : ""
    }, [pendingChanges.list_availability_id, project.list_availability_id])

    const listImportSourceValue = useMemo(() => {
      const pending = pendingChanges.list_import_source_id
      if (pending !== undefined) {
        return pending == null ? "" : String(pending)
      }
      return project.list_import_source_id != null ? String(project.list_import_source_id) : ""
    }, [pendingChanges.list_import_source_id, project.list_import_source_id])

    const projectLabel = project.name?.trim() || `案件 ${project.id}`
    const clientCompany = project.client_company?.trim()
    const clientContact = project.client_name?.trim()
    const clientLabel = clientCompany || clientContact || "クライアント未設定"
    const showClientContact = Boolean(clientCompany && clientContact && clientCompany !== clientContact)

    const projectInfoCell = (
      <td
        key="project"
        className="sticky left-0 z-20 bg-background group-hover:bg-muted/60 px-3 py-2 align-top border-r border-border min-w-[200px]"
      >
        <div className="flex flex-col gap-1">
          <Link
            href={`/projects/${project.id}`}
            className="text-xs font-medium text-primary hover:underline leading-tight"
          >
            {projectLabel}
          </Link>
          <span className="text-[11px] text-muted-foreground">案件ID: {project.id}</span>
          {editMode ? (
            <span className="text-[10px] font-medium text-red-500">編集中</span>
          ) : null}
        </div>
      </td>
    )

    const clientInfoCell = (
      <td
        key="client"
        className="sticky z-10 bg-background group-hover:bg-muted/60 px-3 py-2 align-top border-r border-border min-w-[200px]"
        style={{ left: STICKY_CLIENT_OFFSET }}
      >
        <div className="text-xs font-medium text-foreground leading-tight">{clientLabel}</div>
        {showClientContact ? (
          <span className="text-[11px] text-muted-foreground">担当: {clientContact}</span>
        ) : null}
      </td>
    )

    const readOnlyCells = [
      <td key="progress" className="p-2 align-middle text-xs min-w-[180px]">{project.progress_status || "-"}</td>,
      <td key="appointment" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">{project.appointment_count || 0}</td>,
      <td key="approval" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">{project.approval_count || 0}</td>,
      <td key="reply" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">{project.reply_count || 0}</td>,
      <td key="friends" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">{project.friends_count || 0}</td>,
      <td key="director-login" className="p-2 align-middle text-center text-xs min-w-[80px]">{project.director_login_available ? "✓" : ""}</td>,
      <td key="operator-invite" className="p-2 align-middle text-center text-xs min-w-[80px]">{project.operator_group_invited ? "✓" : ""}</td>,
      <td key="situation" className="p-2 align-top text-xs min-w-[150px]">{project.situation || "-"}</td>,
      <td key="regular-meeting" className="p-2 align-middle text-center text-xs min-w-[80px]">{formatDate(project.regular_meeting_date)}</td>,
      <td key="list-source" className="p-2 align-top text-xs min-w-[100px]">{project.list_import_source || "-"}</td>,
      <td key="entry-date" className="p-2 align-middle text-center text-xs min-w-[80px]">{formatDate(project.entry_date_sales)}</td>,
      <td key="progress-tasks" className="p-2 align-top text-xs min-w-[150px]">{project.progress_tasks || "-"}</td>,
      <td key="daily-tasks" className="p-2 align-top text-xs min-w-[150px]">{project.daily_tasks || "-"}</td>,
      <td key="reply-notes" className="p-2 align-top text-xs min-w-[150px]">{project.reply_check_notes || "-"}</td>,
      <td key="remarks" className="p-2 align-top text-xs min-w-[150px]">{project.remarks || "-"}</td>,
      <td key="complaints" className="p-2 align-top text-xs min-w-[150px]">{project.complaints_requests || "-"}</td>,
      <td key="director" className="p-2 align-middle text-xs min-w-[80px]">{project.director || "-"}</td>,
      <td key="operator" className="p-2 align-middle text-xs min-w-[80px]">{project.operator || "-"}</td>,
      <td key="sales" className="p-2 align-middle text-xs min-w-[80px]">{project.sales_person || "-"}</td>,
      <td key="operation-start" className="p-2 align-middle text-center text-xs min-w-[80px]">{formatDate(project.operation_start_date)}</td>,
      <td key="expected-end" className="p-2 align-middle text-center text-xs min-w-[80px]">{formatDate(project.expected_end_date)}</td>,
      <td key="service" className="p-2 align-top text-xs min-w-[100px]">{project.service_type || "-"}</td>,
      <td key="media" className="p-2 align-top text-xs min-w-[80px]">{project.media_type || "-"}</td>,
      <td key="meeting-status" className="p-2 align-top text-xs min-w-[100px]">{project.regular_meeting_status || "-"}</td>,
      <td key="list-availability" className="p-2 align-top text-xs min-w-[80px]">{project.list_availability || "-"}</td>,
      <td key="company-count" className="p-2 align-middle text-center text-xs min-w-[60px]"><div className="font-medium text-blue-600">{project.company_count || 0}</div></td>,
      <td key="history" className="p-2 align-middle text-center text-xs min-w-[120px]">
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenHistory(project)}>
            <History className="h-3 w-3 mr-1" />
            履歴
          </Button>
        </div>
      </td>,
    ]

    const editCells = [
      <td key="progress" className="p-2 align-top text-xs min-w-[180px]">
        <Select value={progressStatusValue} onValueChange={(value) => handleIntegerSelectChange("progress_status_id", value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={project.progress_status || "進行状況を選択"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debug" className="text-red-500 text-xs">
              DEBUG: {progressStatuses.length}件
            </SelectItem>
            {progressStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id.toString()} className="text-xs">
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>,
      <td key="appointment" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">
        <Input
          type="number"
          value={getPendingValue('appointment_count', project.appointment_count || 0)}
          onChange={(e) => handleNumberChange('appointment_count', e.target.value)}
          className="w-12 h-8 text-xs text-center p-1"
        />
      </td>,
      <td key="approval" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">
        <Input
          type="number"
          value={getPendingValue('approval_count', project.approval_count || 0)}
          onChange={(e) => handleNumberChange('approval_count', e.target.value)}
          className="w-12 h-8 text-xs text-center p-1"
        />
      </td>,
      <td key="reply" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">
        <Input
          type="number"
          value={getPendingValue('reply_count', project.reply_count || 0)}
          onChange={(e) => handleNumberChange('reply_count', e.target.value)}
          className="w-12 h-8 text-xs text-center p-1"
        />
      </td>,
      <td key="friends" className="p-1 align-middle text-center text-xs min-w-[50px] w-[50px]">
        <Input
          type="number"
          value={getPendingValue('friends_count', project.friends_count || 0)}
          onChange={(e) => handleNumberChange('friends_count', e.target.value)}
          className="w-12 h-8 text-xs text-center p-1"
        />
      </td>,
      <td key="director-login" className="p-2 align-middle text-center text-xs min-w-[80px]">
        <Checkbox
          checked={getPendingValue('director_login_available', project.director_login_available || false)}
          onCheckedChange={(checked) => handleBooleanChange('director_login_available', checked)}
        />
      </td>,
      <td key="operator-invite" className="p-2 align-middle text-center text-xs min-w-[80px]">
        <Checkbox
          checked={getPendingValue('operator_group_invited', project.operator_group_invited || false)}
          onCheckedChange={(checked) => handleBooleanChange('operator_group_invited', checked)}
        />
      </td>,
      <td key="situation" className="p-2 align-top text-xs min-w-[150px]">
        <Textarea
          value={getPendingValue('situation', project.situation || '') ?? ''}
          onChange={(e) => handleTextChange('situation', e.target.value)}
          className="w-full h-12 text-xs p-1 resize-none"
          rows={2}
        />
      </td>,
      <td key="regular-meeting" className="p-2 align-middle text-center text-xs min-w-[80px]">
        <Input
          type="date"
          value={getPendingValue('regular_meeting_date', project.regular_meeting_date || '') ?? ''}
          onChange={(e) => handleTextChange('regular_meeting_date', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="list-source" className="p-2 align-middle text-xs min-w-[100px]">
        <Select value={listImportSourceValue} onValueChange={(value) => handleIntegerSelectChange('list_import_source_id', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="リスト輸入先を選択" />
          </SelectTrigger>
          <SelectContent>
            {listImportSources.map((source) => (
              <SelectItem key={source.id} value={source.id.toString()} className="text-xs">
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>,
      <td key="entry-date" className="p-2 align-middle text-center text-xs min-w-[80px]">
        <Input
          type="date"
          value={getPendingValue('entry_date_sales', project.entry_date_sales || '') ?? ''}
          onChange={(e) => handleTextChange('entry_date_sales', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="progress-tasks" className="p-2 align-top text-xs min-w-[150px]">
        <Textarea
          value={getPendingValue('progress_tasks', project.progress_tasks || '') ?? ''}
          onChange={(e) => handleTextChange('progress_tasks', e.target.value)}
          className="w-full h-12 text-xs p-1 resize-none"
          rows={2}
        />
      </td>,
      <td key="daily-tasks" className="p-2 align-top text-xs min-w-[150px]">
        <Textarea
          value={getPendingValue('daily_tasks', project.daily_tasks || '') ?? ''}
          onChange={(e) => handleTextChange('daily_tasks', e.target.value)}
          className="w-full h-12 text-xs p-1 resize-none"
          rows={2}
        />
      </td>,
      <td key="reply-notes" className="p-2 align-top text-xs min-w-[150px]">
        <Textarea
          value={getPendingValue('reply_check_notes', project.reply_check_notes || '') ?? ''}
          onChange={(e) => handleTextChange('reply_check_notes', e.target.value)}
          className="w-full h-12 text-xs p-1 resize-none"
          rows={2}
        />
      </td>,
      <td key="remarks" className="p-2 align-top text-xs min-w-[150px]">
        <Textarea
          value={getPendingValue('remarks', project.remarks || '') ?? ''}
          onChange={(e) => handleTextChange('remarks', e.target.value)}
          className="w-full h-12 text-xs p-1 resize-none"
          rows={2}
        />
      </td>,
      <td key="complaints" className="p-2 align-top text-xs min-w-[150px]">
        <Textarea
          value={getPendingValue('complaints_requests', project.complaints_requests || '') ?? ''}
          onChange={(e) => handleTextChange('complaints_requests', e.target.value)}
          className="w-full h-12 text-xs p-1 resize-none"
          rows={2}
        />
      </td>,
      <td key="director" className="p-2 align-middle text-xs min-w-[80px]">
        <Input
          value={getPendingValue('director', project.director || '') ?? ''}
          onChange={(e) => handleTextChange('director', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="operator" className="p-2 align-middle text-xs min-w-[80px]">
        <Input
          value={getPendingValue('operator', project.operator || '') ?? ''}
          onChange={(e) => handleTextChange('operator', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="sales" className="p-2 align-middle text-xs min-w-[80px]">
        <Input
          value={getPendingValue('sales_person', project.sales_person || '') ?? ''}
          onChange={(e) => handleTextChange('sales_person', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="operation-start" className="p-2 align-middle text-center text-xs min-w-[80px]">
        <Input
          type="date"
          value={getPendingValue('operation_start_date', project.operation_start_date || '') ?? ''}
          onChange={(e) => handleTextChange('operation_start_date', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="expected-end" className="p-2 align-middle text-center text-xs min-w-[80px]">
        <Input
          type="date"
          value={getPendingValue('expected_end_date', project.expected_end_date || '') ?? ''}
          onChange={(e) => handleTextChange('expected_end_date', e.target.value)}
          className="h-8 text-xs"
        />
      </td>,
      <td key="service" className="p-2 align-middle text-xs min-w-[100px]">
        <Select value={serviceTypeValue} onValueChange={(value) => handleIntegerSelectChange('service_type_id', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="サービスを選択" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes.map((service) => (
              <SelectItem key={service.id} value={service.id.toString()} className="text-xs">
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>,
      <td key="media" className="p-2 align-middle text-xs min-w-[80px]">
        <Select value={mediaTypeValue} onValueChange={(value) => handleIntegerSelectChange('media_type_id', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="媒体を選択" />
          </SelectTrigger>
          <SelectContent>
            {mediaTypes.map((media) => (
              <SelectItem key={media.id} value={media.id.toString()} className="text-xs">
                {media.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>,
      <td key="meeting-status" className="p-2 align-middle text-xs min-w-[100px]">
        <Select
          value={regularMeetingStatusValue}
          onValueChange={(value) => handleIntegerSelectChange('regular_meeting_status_id', value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="定例会ステータスを選択" />
          </SelectTrigger>
          <SelectContent>
            {meetingStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id.toString()} className="text-xs">
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>,
      <td key="list-availability" className="p-2 align-middle text-xs min-w-[80px]">
        <Select
          value={listAvailabilityValue}
          onValueChange={(value) => handleIntegerSelectChange('list_availability_id', value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="リスト有無を選択" />
          </SelectTrigger>
          <SelectContent>
            {listAvailabilities.map((availability) => (
              <SelectItem key={availability.id} value={availability.id.toString()} className="text-xs">
                {availability.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>,
      <td key="company-count" className="p-2 align-middle text-center text-xs min-w-[60px]">
        <div className="font-medium text-blue-600">{project.company_count || 0}</div>
      </td>,
      <td key="history" className="p-2 align-middle text-center text-xs min-w-[120px]">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenHistory(project)}
            disabled={isPending}
          >
            <History className="h-3 w-3 mr-1" />
            履歴
          </Button>
        </div>
      </td>,
    ]

    const cells = editMode ? editCells : readOnlyCells

    return (
      <tr data-project-id={project.id} className="group border-b hover:bg-muted/40" aria-busy={isPending}>
        {projectInfoCell}
        {clientInfoCell}
        {cells}
      </tr>
    )
  }
)

ProjectTableRow.displayName = "ProjectTableRow"

export default ProjectTableRow
