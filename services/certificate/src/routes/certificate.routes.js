import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCertificate } from '../controllers/certificate.controller.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'certificate' });
});

router.get('/', requireAuth, getCertificate);

export default router;
