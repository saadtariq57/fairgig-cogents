import { Router } from 'express';
import certificateRoutes from './certificate.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'certificate' });
});

router.use('/certificate', certificateRoutes);

export default router;
