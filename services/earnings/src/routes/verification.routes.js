import { Router } from 'express';
import {
  postVerification,
  getVerifications,
  patchVerification,
} from '../controllers/verification.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadScreenshot } from '../middleware/uploads.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('worker'), uploadScreenshot, postVerification);
router.get('/', requireRole('verifier', 'advocate'), getVerifications);
router.patch('/:id', requireRole('verifier'), patchVerification);

export default router;
