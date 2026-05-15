import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const logDir = path.resolve(process.env.LOG_DIR || 'logs');
const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const minLevel: LogLevel =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL in levelOrder
    ? (process.env.LOG_LEVEL as LogLevel)
    : defaultLevel;
const sensitiveKey = /password|token|secret|authorization|cookie|api[-_]?key/i;
const useColors =
  !process.env.NO_COLOR &&
  process.env.LOG_COLORS !== 'false' &&
  (process.stdout.isTTY || process.env.LOG_COLORS === 'true');
let printedHttpHeader = false;

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

const color = (value: string, colorCode: string): string => {
  return useColors ? `${colorCode}${value}${colors.reset}` : value;
};

const pad = (value: unknown, width: number): string => {
  return String(value ?? '')
    .slice(0, width)
    .padEnd(width);
};

const formatBytes = (value: unknown): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  if (value < 1024) {
    return `${value}b`;
  }

  return `${(value / 1024).toFixed(1)}kb`;
};

const formatTime = (timestamp: unknown): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date();

  return date.toLocaleTimeString('en-US', { hour12: false });
};

const levelColor = (level: LogLevel): string => {
  if (level === 'error') return colors.red;
  if (level === 'warn') return colors.yellow;
  if (level === 'debug') return colors.gray;
  return colors.green;
};

const methodColor = (method: unknown): string => {
  if (method === 'POST') return colors.cyan;
  if (method === 'PATCH') return colors.magenta;
  if (method === 'PUT') return colors.yellow;
  if (method === 'DELETE') return colors.red;
  return colors.blue;
};

const statusColor = (statusCode: unknown): string => {
  if (typeof statusCode !== 'number') return colors.gray;
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  return colors.green;
};

const durationColor = (durationMs: unknown): string => {
  if (typeof durationMs !== 'number') return colors.gray;
  if (durationMs >= 1000) return colors.red;
  if (durationMs >= 300) return colors.yellow;
  return colors.green;
};

const printHttpHeader = (): void => {
  if (printedHttpHeader) {
    return;
  }

  printedHttpHeader = true;
  console.log(
    color(
      `${pad('time', 10)} ${pad('level', 5)} ${pad('method', 7)} ${pad('code', 4)} ${pad(
        'duration',
        10
      )} ${pad('size', 8)} ${pad('path', 42)} ${pad('req', 8)} message`,
      colors.dim
    )
  );
};

const printHttpLog = (level: LogLevel, entry: LogMeta): void => {
  printHttpHeader();

  const line = [
    color(pad(formatTime(entry.timestamp), 10), colors.gray),
    color(pad(level.toUpperCase(), 5), levelColor(level)),
    color(pad(entry.method, 7), methodColor(entry.method)),
    color(pad(entry.statusCode, 4), statusColor(entry.statusCode)),
    color(
      pad(typeof entry.durationMs === 'number' ? `${entry.durationMs}ms` : '-', 10),
      durationColor(entry.durationMs)
    ),
    pad(formatBytes(entry.responseSize), 8),
    pad(entry.path, 42),
    pad(typeof entry.requestId === 'string' ? entry.requestId.slice(0, 8) : '-', 8),
    entry.message,
  ].join(' ');

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};

const printToTerminal = (level: LogLevel, entry: LogMeta): void => {
  if (entry.method && entry.path && entry.statusCode) {
    printHttpLog(level, entry);
    return;
  }

  const line = [
    color(`[${formatTime(entry.timestamp)}]`, colors.gray),
    color(pad(level.toUpperCase(), 5), levelColor(level)),
    entry.message,
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
