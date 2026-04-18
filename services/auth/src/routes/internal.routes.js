import { Router } from 'express';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { unauthorized, badRequest, notFound } from '../lib/errors.js';
import { toPublicProfile } from '../services/user.service.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireInternalKey(req, _res, next) {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== config.internalApiKey) {
    return next(unauthorized('Invalid or missing internal api key'));
  }
  next();
}

router.use(requireInternalKey);

router.get('/users/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!UUID_RE.test(id)) throw badRequest('id must be a valid uuid');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw notFound('User not found');

    res.json(toPublicProfile(user));
  } catch (err) {
    next(err);
  }
});

export default router;
