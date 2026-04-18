import { Router } from 'express';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { unauthorized, badRequest } from '../lib/errors.js';

const router = Router();

function requireInternalKey(req, _res, next) {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== config.internalApiKey) {
    return next(unauthorized('Invalid or missing internal api key'));
  }
  next();
}

router.use(requireInternalKey);

router.get('/top-complaints', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    if (days < 1 || days > 365) {
      return next(badRequest('days must be between 1 and 365'));
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await prisma.grievance.groupBy({
      by: ['category'],
      where: { postedAt: { gte: since } },
      _count: { _all: true },
    });

    const items = grouped
      .map((g) => ({ category: g.category, count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    res.json({ window_days: days, items });
  } catch (err) {
    next(err);
  }
});

export default router;
