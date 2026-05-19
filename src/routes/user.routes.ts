import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { clearAuthCookie } from '../config/jwt.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  cacheUser,
  clearCachedUser,
  getCachedUserById,
  normalizeUserEmail,
  type CachedUser,
} from '../services/user-cache.service.js';

const router = express.Router();

type UpdateUserBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const parseUserId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const toPublicUser = (user: CachedUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const findActiveUserById = async (id: number): Promise<CachedUser | null> => {
  const cachedUser = await getCachedUserById(id);

  if (cachedUser && !cachedUser.deleted_at) {
    return cachedUser;
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (user) {
    await cacheUser(user);
  }

  return user;
};

router.use(requireAuth);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all active users
 *     description: Returns all users that have not been soft deleted.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      deleted_at: null,
    },
    orderBy: {
      id: 'asc',
    },
  });

  return res.status(200).json({
    message: 'Users retrieved successfully',
    data: users.map(toPublicUser),
  });
});

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get the current logged-in user
 *     description: Returns the active user identified by the authentication cookie.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Current user no longer exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', async (req: Request, res: Response) => {
  const user = req.auth ? await findActiveUserById(req.auth.id) : null;

  if (!user) {
    clearAuthCookie(res);
    return res.status(404).json({ message: 'Current user not found' });
  }

  return res.status(200).json({
    message: 'Current user retrieved successfully',
    data: toPublicUser(user),
  });
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     description: Returns one active user by id.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const id = parseUserId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'User id must be a positive integer' });
  }

  const user = await findActiveUserById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({
    message: 'User retrieved successfully',
    data: toPublicUser(user),
  });
});

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     description: Updates name, email, or password for one active user.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email is already in use.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id',
  async (req: Request<{ id: string }, unknown, UpdateUserBody>, res: Response) => {
    const id = parseUserId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'User id must be a positive integer' });
    }

    const existingUser = await findActiveUserById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data: { name?: string; email?: string; password?: string } = {};

    if (req.body.name !== undefined) {
      if (!isNonEmptyString(req.body.name)) {
        return res.status(400).json({ message: 'Name must be a valid string' });
      }

      data.name = req.body.name.trim();
    }

    if (req.body.email !== undefined) {
      if (!isNonEmptyString(req.body.email)) {
        return res.status(400).json({ message: 'Email must be a valid string' });
      }

      const normalizedEmail = normalizeUserEmail(req.body.email);
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: {
            not: id,
          },
        },
      });

      if (duplicateUser) {
        return res.status(409).json({ message: 'Email is already in use' });
      }

      data.email = normalizedEmail;
    }

    if (req.body.password !== undefined) {
      if (!isNonEmptyString(req.body.password)) {
        return res.status(400).json({ message: 'Password must be a valid string' });
      }

      data.password = await bcrypt.hash(req.body.password, 10);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'At least one user field must be provided' });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data,
    });

    await Promise.all([clearCachedUser(existingUser), cacheUser(updatedUser)]);

    return res.status(200).json({
      message: 'User updated successfully',
      data: toPublicUser(updatedUser),
    });
  }
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Soft delete a user
 *     description: Marks a user as deleted without removing the row from the database.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const id = parseUserId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'User id must be a positive integer' });
  }

  const existingUser = await findActiveUserById(id);
  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const deletedUser = await prisma.user.update({
    where: {
      id,
    },
    data: {
      deleted_at: new Date(),
    },
  });

  await clearCachedUser(existingUser);

  if (req.auth?.id === id) {
    clearAuthCookie(res);
  }

  return res.status(200).json({
    message: 'User deleted successfully',
    data: toPublicUser(deletedUser),
  });
});

export default router;
