import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import prisma from './config/prisma.js';
import createSwaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const swaggerSpec = createSwaggerSpec();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// JSON response formatting
app.set('json spaces', 2);

app.get('/', (req, res) => {
  res.send('Hello World!');
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
app.get('/health/server', (req, res) => {
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
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/auth', authRoutes);
