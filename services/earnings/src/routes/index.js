import { Router } from 'express';
import express from 'express';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import shiftRoutes from './shift.routes.js';
import verificationRoutes from './verification.routes.js';
import workerRoutes from './worker.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'earnings', db: 'reachable' });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'earnings',
      db: 'unreachable',
      error: err.message,
    });
  }
});

router.use('/uploads', express.static(config.uploads.dir));

router.use('/internal', internalRoutes);
router.use('/shifts', shiftRoutes);
router.use('/verifications', verificationRoutes);
router.use('/workers', workerRoutes);

export default router;
