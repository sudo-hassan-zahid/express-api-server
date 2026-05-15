import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import { logger, redact } from '../services/logger.service.js';

type RequestWithId = Request & {
  id?: string;
};

const getRequestId = (req: Request): string => {
  return req.get('x-request-id') || crypto.randomUUID();
};

const getResponseSize = (res: Response): number | undefined => {
  const contentLength = res.getHeader('content-length');

  if (typeof contentLength === 'number') {
    return contentLength;
  }

  if (typeof contentLength === 'string') {
    return Number(contentLength);
  }

  return undefined;
};

const getStatusCode = (error: unknown): number => {
  if (typeof error === 'object' && error !== null) {
    const status =
      (error as { status?: number; statusCode?: number }).statusCode ||
      (error as { status?: number; statusCode?: number }).status;

    return status && status >= 400 && status <= 599 ? status : 500;
  }

  return 500;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unexpected server error';
};

export const requestLogger: RequestHandler = (req: RequestWithId, res, next) => {
  const startTime = performance.now();
  const requestId = getRequestId(req);

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const durationMs = Number((performance.now() - startTime).toFixed(2));
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[level]('HTTP request completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      durationMs,
      responseSize: getResponseSize(res),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      query: redact(req.query),
      body: redact(req.body),
    });
  });

  next();
};

export const notFoundHandler: RequestHandler = (req: RequestWithId, res) => {
  res.status(404).json({
    status: 'ERROR',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.id,
  });
};

export const errorHandler: ErrorRequestHandler = (error, req: RequestWithId, res, next) => {
  const statusCode = getStatusCode(error);

  logger.error('Unhandled request error', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error,
  });

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(statusCode).json({
    status: 'ERROR',
    message:
      statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : getErrorMessage(error),
    requestId: req.id,
  });
};
