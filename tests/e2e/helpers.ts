import { request as playwrightRequest, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'

const API_HOST = process.env.E2E_API_HOST ?? 'http://localhost:8002'
const API_PREFIX = '/api/v1'
export const API_BASE_URL = `${API_HOST}${API_PREFIX}`

export interface AuthenticatedContext {
  context: APIRequestContext
  accessToken: string
  refreshToken: string
}

async function ensureOk(response: APIResponse, action: string) {
  if (!response.ok()) {
    let detail = ''
    try {
      const data = await response.json()
      detail = typeof data === 'string' ? data : data?.error || data?.message || JSON.stringify(data)
    } catch {
      try {
        detail = await response.text()
      } catch {
        detail = ''
      }
    }
    throw new Error(`${action} が失敗しました (status ${response.status()}) ${detail}`)
  }
}

export async function createAuthenticatedContext(email: string, password: string): Promise<AuthenticatedContext> {
  const loginContext = await playwrightRequest.newContext({
    baseURL: API_HOST,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  })

  const loginResponse = await loginContext.post(`${API_PREFIX}/auth/login/`, {
    data: { email, password },
  })
  await ensureOk(loginResponse, 'ログイン')
  const loginData = await loginResponse.json()
  await loginContext.dispose()

  const authedContext = await playwrightRequest.newContext({
    baseURL: API_HOST,
    extraHTTPHeaders: {
      Authorization: `Bearer ${loginData.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  return {
    context: authedContext,
    accessToken: loginData.access_token,
    refreshToken: loginData.refresh_token,
  }
}

export async function createClient(api: APIRequestContext, payload: Record<string, any>) {
  const response = await api.post(`${API_PREFIX}/clients/`, { data: payload })
  await ensureOk(response, 'クライアント作成')
  return response.json()
}

export async function createCompany(api: APIRequestContext, payload: Record<string, any>) {
  const response = await api.post(`${API_PREFIX}/companies/`, { data: payload })
  await ensureOk(response, '企業作成')
  return response.json()
}

export async function createProject(api: APIRequestContext, payload: Record<string, any>) {
  const response = await api.post(`${API_PREFIX}/projects/`, { data: payload })
  await ensureOk(response, '案件作成')
  return response.json()
}

export async function createUser(api: APIRequestContext, payload: Record<string, any>) {
  const response = await api.post(`${API_PREFIX}/auth/users/create/`, { data: payload })
  await ensureOk(response, 'ユーザー作成')
  return response.json()
}

export async function deleteResource(api: APIRequestContext, path: string) {
  const response = await api.delete(`${API_PREFIX}${path}`)
  if (!response.ok() && response.status() !== 404) {
    const message = await response.text()
    throw new Error(`削除に失敗しました (${path}): ${response.status()} ${message}`)
  }
}

export async function updateUser(api: APIRequestContext, userId: number, payload: Record<string, any>) {
  const response = await api.patch(`${API_PREFIX}/auth/users/${userId}/`, { data: payload })
  await ensureOk(response, 'ユーザー更新')
  return response.json()
}

export async function addCompaniesToProject(api: APIRequestContext, projectId: number, companyIds: number[]) {
  const response = await api.post(`${API_PREFIX}/projects/${projectId}/add-companies/`, { data: { company_ids: companyIds } })
  await ensureOk(response, '案件への企業追加')
  return response.json()
}

export async function fetchProject(api: APIRequestContext, projectId: number, params: Record<string, any> = {}) {
  const searchParams = new URLSearchParams(params as Record<string, string>)
  const path = `${API_PREFIX}/projects/${projectId}/` + (searchParams.toString() ? `?${searchParams.toString()}` : '')
  const response = await api.get(path)
  await ensureOk(response, '案件取得')
  return response.json()
}

interface LoginThroughUIOptions {
  email: string
  password: string
  redirectPattern?: RegExp
  fallbackPath?: string
}

export async function loginThroughUI(page: Page, options: LoginThroughUIOptions) {
  const {
    email,
    password,
    redirectPattern,
    fallbackPath,
  } = options
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForLoadState('networkidle')

  if (redirectPattern) {
    try {
      await page.waitForURL(redirectPattern, { timeout: 15000 })
      return
    } catch (error) {
      if (!fallbackPath) {
        throw error
      }
    }
  }

  if (fallbackPath) {
    await page.goto(fallbackPath, { waitUntil: 'networkidle' })
  }
}

export async function loginViaApiAndRestoreSession(
  page: Page,
  { email, password, redirectPath = '/companies' }: { email: string; password: string; redirectPath?: string },
) {
  const { context, accessToken, refreshToken } = await createAuthenticatedContext(email, password)
  await context.dispose()

  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
    },
    { access: accessToken, refresh: refreshToken },
  )

  await page.goto(redirectPath, { waitUntil: 'networkidle' })
  await page.waitForLoadState('networkidle')
}

interface ConsoleInspectorOptions {
  allowedMessages?: RegExp[]
}

const DEFAULT_ALLOWED_PATTERNS = [
  /due to access control checks/i,
  /blocked by Content Security Policy/i,
  /ResizeObserver loop limit exceeded/i,
]

export function attachConsoleErrorInspector(page: Page, options: ConsoleInspectorOptions = {}) {
  const allowedPatterns = [...DEFAULT_ALLOWED_PATTERNS, ...(options.allowedMessages ?? [])]
  const isAllowed = (message: string) => allowedPatterns.some((pattern) => pattern.test(message))

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text().trim()
    if (isAllowed(text)) return
    throw new Error(`[console.error] ${text}`)
  })

  page.on('pageerror', (error) => {
    const message = (error?.message ?? '').trim()
    if (isAllowed(message)) return
    throw new Error(`[pageerror] ${message || error}`)
  })
}
