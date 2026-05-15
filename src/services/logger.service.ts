import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const logDir = path.resolve(process.env.LOG_DIR || 'logs');
const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const minLevel: LogLevel =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL in levelOrder
    ? (process.env.LOG_LEVEL as LogLevel)
    : defaultLevel;
const sensitiveKey = /password|token|secret|authorization|cookie|api[-_]?key/i;

export const redact = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (Array.isArray(value)) {
    return value.map(redact);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : redact(nestedValue),
    ])
  );
};

const appendLogFile = (fileName: string, entry: LogMeta): void => {
  if (process.env.LOG_TO_FILE === 'false') {
    return;
  }

  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFile(path.join(logDir, fileName), `${JSON.stringify(entry)}\n`, (error) => {
    if (error) {
      console.error('Failed to write log file:', error.message);
    }
  });
};

const printToTerminal = (level: LogLevel, entry: LogMeta): void => {
  const line = [
    `[${entry.timestamp}]`,
    level.toUpperCase(),
    entry.message,
    entry.method,
    entry.path,
    entry.statusCode,
    entry.durationMs ? `${entry.durationMs}ms` : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  output(line);
};

const writeLog = (level: LogLevel, message: string, meta: LogMeta = {}): void => {
  if (levelOrder[level] < levelOrder[minLevel]) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(redact(meta) as LogMeta),
  };

  printToTerminal(level, entry);
  appendLogFile('app.log', entry);

  if (level === 'error') {
    appendLogFile('error.log', entry);
  }
};

export const logger = {
  debug: (message: string, meta?: LogMeta) => writeLog('debug', message, meta),
  info: (message: string, meta?: LogMeta) => writeLog('info', message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog('warn', message, meta),
  error: (message: string, meta?: LogMeta) => writeLog('error', message, meta),
};
