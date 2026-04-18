import { Router } from 'express';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { unauthorized, badRequest } from '../lib/errors.js';
import { shiftToApi } from '../lib/money.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function requireInternalKey(req, _res, next) {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== config.internalApiKey) {
    return next(unauthorized('Invalid or missing internal api key'));
  }
  next();
}

router.use(requireInternalKey);

// verified shifts only
router.get('/shifts/verified', async (req, res, next) => {
  try {
    const workerId = String(req.query.worker_id || '');
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');

    if (!UUID_RE.test(workerId)) throw badRequest('worker_id must be a valid uuid');
    if (!DATE_RE.test(from)) throw badRequest('from must be YYYY-MM-DD');
    if (!DATE_RE.test(to)) throw badRequest('to must be YYYY-MM-DD');

    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T23:59:59Z`);

    const items = await prisma.shift.findMany({
      where: {
        workerId,
        verificationStatus: 'confirmed',
        shiftDate: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ shiftDate: 'asc' }],
    });

    res.json({
      worker_id: workerId,
      from,
      to,
      items: items.map(shiftToApi),
      total: items.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
