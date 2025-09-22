const levelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

type LogContext = Record<string, unknown>

const envLevel = (() => {
  const raw = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_LOG_LEVEL : undefined) ?? 'info'
  const normalized = raw.toLowerCase()
  return (['error', 'warn', 'info', 'debug'].includes(normalized) ? normalized : 'info') as LogLevel
})()

function shouldLog(level: LogLevel) {
  return levelPriority[level] <= levelPriority[envLevel]
}

function formatMessage(namespace: string, message: string, context?: LogContext) {
  if (context && Object.keys(context).length > 0) {
    return [`[${namespace}] ${message}`, context] as const
  }
  return [`[${namespace}] ${message}`] as const
}

export function createLogger(namespace: string, baseContext: LogContext = {}) {
  return {
    error(message: string, context?: LogContext) {
      if (!shouldLog('error')) return
      console.error(...formatMessage(namespace, message, { ...baseContext, ...context }))
    },
    warn(message: string, context?: LogContext) {
      if (!shouldLog('warn')) return
      console.warn(...formatMessage(namespace, message, { ...baseContext, ...context }))
    },
    info(message: string, context?: LogContext) {
      if (!shouldLog('info')) return
      console.info(...formatMessage(namespace, message, { ...baseContext, ...context }))
    },
    debug(message: string, context?: LogContext) {
      if (!shouldLog('debug')) return
      console.debug(...formatMessage(namespace, message, { ...baseContext, ...context }))
    },
  }
}

export const appLogger = createLogger('app')
