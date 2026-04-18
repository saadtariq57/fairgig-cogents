import { Router } from 'express';
import { prisma } from '../prisma.js';
import grievanceRoutes from './grievance.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'grievance', db: 'reachable' });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'grievance',
      db: 'unreachable',
      error: err.message,
    });
  }
});

// internal routes use a shared API key, not JWT — mount BEFORE the JWT-gated router
router.use('/grievances/internal', internalRoutes);

router.use('/grievances', grievanceRoutes);

export default router;
