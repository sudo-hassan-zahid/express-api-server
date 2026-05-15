import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import prisma from './config/prisma.js';
import createSwaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const swaggerSpec = createSwaggerSpec();

app.use(express.json());
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/swagger.json', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// JSON response formatting
app.set('json spaces', 2);

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

app.use('/api/auth', authRoutes);
