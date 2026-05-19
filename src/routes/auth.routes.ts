import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '../config/jwt.js';
import prisma from '../config/prisma.js';
import {
  cacheUser,
  getCachedUserByEmail,
  normalizeUserEmail,
} from '../services/user-cache.service.js';

const router = express.Router();

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

type AuthRequest<TBody> = Request<Record<string, never>, unknown, TBody>;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a user
 *     description: Creates a new user account with a hashed password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Name, email and password are required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req: AuthRequest<RegisterBody>, res: Response) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ message: 'Name, email and password must be valid strings' });
  }

  const normalizedEmail = normalizeUserEmail(email);
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  await cacheUser(user);

  res
    .status(201)
    .json({ message: 'User registered successfully', user: { id: user.id, email: user.email } });
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates credentials and returns a JWT with basic user details.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email and password are required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Login failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req: AuthRequest<LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        message: 'Email and password must be valid strings',
      });
    }

    const normalizedEmail = normalizeUserEmail(email);
    let user = await getCachedUserByEmail(normalizedEmail);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        await cacheUser(user);
      }
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
    });

    return res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
