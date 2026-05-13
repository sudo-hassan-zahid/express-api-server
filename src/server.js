import express from 'express';
import dotenv from 'dotenv';
import prisma from './config/prisma.js';
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// JSON response formatting
app.set('json spaces', 2);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/health/server', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});

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

app.use("/api/auth", authRoutes);