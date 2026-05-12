const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const level = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info

export const logger = {
  error: (...args) => level >= 0 && console.error('[ERROR]', ...args),
  warn:  (...args) => level >= 1 && console.warn('[WARN]', ...args),
  info:  (...args) => level >= 2 && console.info('[INFO]', ...args),
  debug: (...args) => level >= 3 && console.debug('[DEBUG]', ...args),
}
