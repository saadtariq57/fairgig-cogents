import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getWorkerProfile } from '../controllers/worker.controller.js';

const router = Router();

router.get('/:worker_id/profile', requireAuth, getWorkerProfile);

export default router;
