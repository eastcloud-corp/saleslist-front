import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  createAuthenticatedContext,
  createClient,
  createProject,
  deleteResource,
  fetchProject,
  attachConsoleErrorInspector,
  loginViaApiAndRestoreSession,
} from './helpers'

type SnapshotSummary = {
  id: number
  project: number
  created_at: string
  created_by: number | null
  reason: string
  source: string
}

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'salesnav_admin@budget-sales.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'salesnav20250901'

async function listSnapshots(api: APIRequestContext, projectId: number, pageSize = 10) {
  const response = await api.get(`/api/v1/projects/${projectId}/snapshots/?page=1&page_size=${pageSize}`)
  if (!response.ok()) {
    const message = await response.text()
    throw new Error(`スナップショット一覧の取得に失敗しました (${response.status()}): ${message}`)
  }
  const data = await response.json()
  if (Array.isArray(data)) {
    return data as SnapshotSummary[]
  }
  return (data?.results ?? []) as SnapshotSummary[]
}

async function login(page: Page) {
  await loginViaApiAndRestoreSession(page, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    redirectPath: '/projects',
  })
}

test.describe('Project Undo & History', () => {
  test('一括編集の取り消し・履歴復元ができる', async ({ page }) => {
    test.setTimeout(120_000)
    attachConsoleErrorInspector(page, { allowedMessages: [/401/, /Unauthorized/] })
    
    const auth = await createAuthenticatedContext(ADMIN_EMAIL, ADMIN_PASSWORD)
    const adminApi = auth.context

    const unique = Date.now()
    const client = await createClient(adminApi, {
      name: `Undoテストクライアント-${unique}`,
      industry: 'IT・ソフトウェア',
      contact_email: `undo-client-${unique}@example.com`,
    })

    const project = await createProject(adminApi, {
      name: `Undoテスト案件-${unique}`,
      client_id: client.id,
      description: 'Undo flow project',
    })

    const projectId = Number(project.id)
    const originalValue = project.appointment_count ?? 0
    const updatedValue = originalValue + 7

    try {
      await login(page)
      await page.goto('/projects', { waitUntil: 'networkidle' })

      const searchInput = page.getByPlaceholder('案件名・クライアント名で検索')
      await expect(searchInput).toBeVisible({ timeout: 20000 })
      await searchInput.fill(project.name)

      const searchButton = page.getByRole('button', { name: /^検索$/ })
      await expect(searchButton).toBeEnabled({ timeout: 10000 })
      await Promise.all([
        page.waitForResponse((response) =>
          response.url().includes('/api/v1/projects')
            && response.request().method() === 'GET'
            && response.url().includes(encodeURIComponent(project.name))
        ),
        searchButton.click(),
      ])

      let row = page.locator(`tr[data-project-id="${projectId}"]`).first()
      await expect(row).toBeVisible({ timeout: 30000 })

      // 編集モード開始
      await page.getByRole('button', { name: '編集モード' }).click()
      const editModeToast = page.locator('[role="status"]').filter({ hasText: '編集モードを開始しました' })
      await expect(editModeToast.first()).toBeVisible({ timeout: 10000 })

      row = page.locator(`tr[data-project-id="${projectId}"]`).first()
      const appointmentInput = row.getByRole('spinbutton').first()
      await appointmentInput.scrollIntoViewIfNeeded()
      await expect(appointmentInput).toBeVisible({ timeout: 20000 })
      await appointmentInput.fill('')
      await appointmentInput.fill(String(updatedValue))

      // 保存（編集完了）
      await Promise.all([
        page.waitForResponse((response) =>
          response.url().includes('/bulk-partial-update')
            && response.request().method() === 'POST'
        ),
        page.getByRole('button', { name: '編集完了' }).click(),
      ])
      await expect(page.locator('text=編集モード OFF').first()).toBeVisible({ timeout: 10000 })

      const afterSave = await fetchProject(adminApi, projectId, { management_mode: 'true' })
      expect(afterSave.appointment_count).toBe(updatedValue)

      // Undo via API (restore to previous snapshot)
      const snapshotsAfterSave = await listSnapshots(adminApi, projectId, 5)
      expect(snapshotsAfterSave.length).toBeGreaterThan(0)
      const undoTargetSnapshot = snapshotsAfterSave[0]

      const undoResponse = await adminApi.post(
        `/api/v1/projects/${projectId}/snapshots/${undoTargetSnapshot.id}/restore/`,
        { data: {} },
      )
      expect(undoResponse.ok()).toBeTruthy()

      const afterUndo = await fetchProject(adminApi, projectId, { management_mode: 'true' })
      expect(afterUndo.appointment_count).toBe(originalValue)

      // Redo via API (restore the automatically created undo snapshot)
      const snapshotsAfterUndo = await listSnapshots(adminApi, projectId, 5)
      const redoTargetSnapshot = snapshotsAfterUndo.find((item) => item.source === 'undo')
      expect(redoTargetSnapshot).toBeDefined()

      const redoResponse = await adminApi.post(
        `/api/v1/projects/${projectId}/snapshots/${redoTargetSnapshot!.id}/restore/`,
        { data: {} },
      )
      expect(redoResponse.ok()).toBeTruthy()

      const afterRedo = await fetchProject(adminApi, projectId, { management_mode: 'true' })
      expect(afterRedo.appointment_count).toBe(updatedValue)
    } finally {
      await deleteResource(adminApi, `/projects/${projectId}/`)
      await deleteResource(adminApi, `/clients/${client.id}/`)
      await adminApi.dispose()
    }
  })
})
