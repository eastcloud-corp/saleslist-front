#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const http = require('http')
const https = require('https')

const composeFile = process.env.PLAYWRIGHT_COMPOSE_FILE || path.resolve(__dirname, '..', '..', 'saleslist-infra', 'docker-compose', 'dev', 'docker-compose.yml')
const composeProject = process.env.PLAYWRIGHT_COMPOSE_PROJECT || ''

const [, , ...cliArgs] = process.argv

if (cliArgs.length === 0) {
  console.error('[run-playwright] 実行対象ディレクトリを指定してください (例: tests/e2e)')
  process.exit(1)
}

const targetDir = cliArgs[0]
const passthroughArgs = cliArgs.length > 1 ? cliArgs.slice(1).filter((arg) => arg !== '--') : []
const shouldUseDocker = process.env.PLAYWRIGHT_USE_DOCKER !== 'false'
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3009'
const keepDockerUp = ['1', 'true', 'yes', 'on'].includes((process.env.PLAYWRIGHT_KEEP_DOCKER_UP || '').toLowerCase())
let basePort = 80
try {
  const parsed = new URL(baseUrl)
  basePort = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80))
} catch (error) {
  console.warn('[run-playwright] baseURLの解析に失敗しました。デフォルトポート80を使用します。')
}
const composeEnv = { ...process.env, FRONTEND_PORT: String(basePort) }
const composeArgsBase = composeProject
  ? ['compose', '-f', composeFile, '-p', composeProject]
  : ['compose', '-f', composeFile]
const repoRoot = path.resolve(__dirname, '..')
const absoluteDir = path.resolve(repoRoot, targetDir)

const ignoredDirs = new Set(['node_modules', '.next', 'test-results'])

function collectSpecFiles(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        return []
      }
      return collectSpecFiles(path.join(dir, entry.name))
    }

    if (!entry.isFile()) {
      return []
    }

    const isSpec = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(entry.name)
    return isSpec ? [path.join(dir, entry.name)] : []
  })
}

const specFiles = collectSpecFiles(absoluteDir)

if (specFiles.length === 0) {
  console.log(`[run-playwright] テストファイルが見つかりませんでした: ${targetDir}`)
  console.log('[run-playwright] Playwright の起動をスキップします。')
  process.exit(0)
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    child.on('close', (code) => {
      if (code === 0) {
        resolve(0)
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
      }
    })
    child.on('error', reject)
  })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForHealthcheck(url, timeoutMs = 180000, intervalMs = 3000) {
  const end = Date.now() + timeoutMs
  const client = url.startsWith('https') ? https : http

  while (Date.now() < end) {
    try {
      await new Promise((resolve, reject) => {
        const req = client.get(url, (res) => {
          res.resume()
          if (res.statusCode && res.statusCode < 500) {
            resolve(true)
          } else {
            reject(new Error(`Status ${res.statusCode}`))
          }
        })
        req.on('error', reject)
        req.setTimeout(5000, () => {
          req.destroy()
          reject(new Error('timeout'))
        })
      })
      console.log(`[run-playwright] ヘルスチェック成功: ${url}`)
      return
    } catch (error) {
      console.log(`[run-playwright] ヘルスチェック待機中 (${url}): ${error.message}`)
      await wait(intervalMs)
    }
  }

  throw new Error(`ヘルスチェックがタイムアウトしました (${url})`)
}

async function ensureDockerUp() {
  if (!shouldUseDocker) {
    console.log('[run-playwright] Docker起動はスキップされました (PLAYWRIGHT_USE_DOCKER=false)')
    return () => Promise.resolve()
  }

  const runningBefore = spawnSync('docker', [...composeArgsBase, 'ps', '--status', 'running', '-q'], {
    encoding: 'utf-8',
    env: composeEnv,
  })
  const alreadyRunning = runningBefore.status === 0 && runningBefore.stdout.trim().length > 0
  if (alreadyRunning) {
    console.log('[run-playwright] 既存のDockerコンテナが稼働中のため再利用します。')
  }

  console.log(`[run-playwright] Dockerコンテナを起動します: ${composeFile}`)
  await runCommand('docker', [...composeArgsBase, 'up', '-d', '--remove-orphans'], { env: composeEnv })

  const healthUrl = `${baseUrl.replace(/\/$/, '')}/`
  console.log(`[run-playwright] ヘルスチェックを待機: ${healthUrl}`)
  await waitForHealthcheck(healthUrl)

  return async () => {
    if (keepDockerUp) {
      console.log('[run-playwright] PLAYWRIGHT_KEEP_DOCKER_UPが有効なため停止処理をスキップします。')
      return
    }
    if (alreadyRunning) {
      console.log('[run-playwright] 既存のコンテナのため停止処理をスキップします。')
      return
    }
    console.log('[run-playwright] Dockerコンテナを停止します')
    try {
      await runCommand('docker', [...composeArgsBase, 'down', '--remove-orphans'], { env: composeEnv })
    } catch (error) {
      console.error('[run-playwright] Docker停止時にエラーが発生しました:', error.message)
    }
  }
}

async function run() {
  console.log(`[run-playwright] ${targetDir} で Playwright テストを ${specFiles.length} 件検出しました。`)
  console.log(`[run-playwright] 実行コマンド: npx playwright test ${targetDir} --reporter=line ${passthroughArgs.join(' ')}`)

  const stopDocker = await ensureDockerUp()

  const heartbeat = setInterval(() => {
    console.log('[run-playwright] Playwright 実行中...')
  }, 30000)

  try {
    await runCommand('npx', ['playwright', 'test', targetDir, '--reporter=line', ...passthroughArgs])
    console.log('[run-playwright] Playwright テストが正常に完了しました。')
    clearInterval(heartbeat)
    await stopDocker()
    process.exit(0)
  } catch (error) {
    clearInterval(heartbeat)
    console.error('[run-playwright] Playwright 実行中にエラーが発生しました。', error.message)
    await stopDocker()
    process.exit(1)
  }
}

run()
