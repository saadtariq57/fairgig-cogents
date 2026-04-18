import { Router } from 'express';
import { prisma } from '../prisma.js';
import authRoutes from './auth.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'auth', db: 'reachable' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', service: 'auth', db: 'unreachable', error: err.message });
  }
});

router.use('/auth', authRoutes);
router.use('/auth/internal', internalRoutes);

export default router;
