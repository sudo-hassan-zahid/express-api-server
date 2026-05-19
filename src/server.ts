import 'dotenv/config';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import prisma from './config/prisma.js';
import { disconnectRedis, redisPing } from './config/redis.js';
import createSwaggerSpec from './config/swagger.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/logging.middleware.js';
import authRoutes from './routes/auth.routes.js';
import { logger } from './services/logger.service.js';

const app = express();
const swaggerSpec = createSwaggerSpec();
const PORT = process.env.PORT || 5000;

// JSON response formatting
app.set('json spaces', 2);
app.use(express.json());
app.use(requestLogger);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/swagger.json', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the API! Visit /swagger for API documentation.');
});

/**
 * @openapi
 * /health/server:
 *   get:
 *     summary: Check server health
 *     description: Returns a simple status response to confirm the API process is running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health/server', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /health/db:
 *   get:
 *     summary: Check database health
 *     description: Runs a lightweight database query to verify PostgreSQL connectivity.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Database connection is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: Database connection failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @openapi
 * /health/redis:
 *   get:
 *     summary: Check Redis health
 *     description: Runs a lightweight Redis PING command to verify cache connectivity.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Redis connection is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: Redis connection failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/health/redis', async (req: Request, res: Response) => {
  const pong = await redisPing();

  if (pong !== 'PONG') {
    return res.status(500).json({
      status: 'ERROR',
      message: 'Redis connection failed',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'OK',
    message: 'Redis connection is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const shutdown = async (signal: string) => {
  logger.info('Shutting down server', { signal });

  await Promise.allSettled([prisma.$disconnect(), disconnectRedis()]);
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});
