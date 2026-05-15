import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const levelColors: Record<LogLevel, number> = { debug: 90, info: 32, warn: 33, error: 31 };
const methodColors: Record<string, number> = { GET: 34, POST: 36, PUT: 33, PATCH: 35, DELETE: 31 };
const sensitiveKey = /password|token|secret|authorization|cookie|api[-_]?key/i;

const logDir = path.resolve(process.env.LOG_DIR || 'logs');
const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const minLevel: LogLevel =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL in levels
    ? (process.env.LOG_LEVEL as LogLevel)
    : defaultLevel;
const useColors =
  !process.env.NO_COLOR &&
  process.env.LOG_COLORS !== 'false' &&
  (process.stdout.isTTY || process.env.LOG_COLORS === 'true');

const color = (value: unknown, code: number): string => {
  const text = String(value ?? '');
  return useColors ? `\x1b[${code}m${text}\x1b[0m` : text;
};

const pad = (value: unknown, width: number): string => {
  return String(value ?? '-')
    .slice(0, width)
    .padEnd(width);
};

const shortTime = (timestamp: unknown): string => {
  return new Date(String(timestamp)).toLocaleTimeString('en-US', { hour12: false });
};

const statusColor = (status: unknown): number => {
  if (typeof status !== 'number') return 90;
  if (status >= 500) return 31;
  if (status >= 400) return 33;
  if (status >= 300) return 36;
  return 32;
};

export const redact = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Error)
    return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map(redact);

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : redact(nestedValue),
    ])
  );
};

const writeFile = (fileName: string, entry: LogMeta): void => {
  if (process.env.LOG_TO_FILE === 'false') return;

  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFile(path.join(logDir, fileName), `${JSON.stringify(entry)}\n`, (error) => {
    if (error) console.error('Failed to write log file:', error.message);
  });
};

const httpLine = (level: LogLevel, entry: LogMeta): string => {
  return [
    color(pad(shortTime(entry.timestamp), 10), 90),
    color(pad(level.toUpperCase(), 5), levelColors[level]),
    color(pad(entry.method, 6), methodColors[String(entry.method)] || 34),
    color(pad(entry.statusCode, 4), statusColor(entry.statusCode)),
    pad(typeof entry.durationMs === 'number' ? `${entry.durationMs}ms` : '-', 9),
    pad(entry.path, 38),
    pad(typeof entry.requestId === 'string' ? entry.requestId.slice(0, 8) : '-', 8),
    entry.message,
  ].join(' | ');
};

const writeLog = (level: LogLevel, message: string, meta: LogMeta = {}): void => {
  if (levels[level] < levels[minLevel]) return;

  const entry: LogMeta = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(redact(meta) as LogMeta),
  };
  const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  output(
    entry.method && entry.path && entry.statusCode
      ? httpLine(level, entry)
      : `${color(`[${shortTime(entry.timestamp)}]`, 90)} ${color(
          pad(level.toUpperCase(), 5),
          levelColors[level]
        )} ${entry.message}`
  );
  writeFile('app.log', entry);
  if (level === 'error') writeFile('error.log', entry);
};

export const logger = {
  debug: (message: string, meta?: LogMeta) => writeLog('debug', message, meta),
  info: (message: string, meta?: LogMeta) => writeLog('info', message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog('warn', message, meta),
  error: (message: string, meta?: LogMeta) => writeLog('error', message, meta),
};
