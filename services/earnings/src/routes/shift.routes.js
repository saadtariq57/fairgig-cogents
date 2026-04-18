import { Router } from 'express';
import {
  postShift,
  getShifts,
  getShiftById,
  patchShift,
  deleteShift,
  importShiftsCsv,
} from '../controllers/shift.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadCsv } from '../middleware/uploads.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('worker'), postShift);
router.get('/', getShifts);
router.post('/import', requireRole('worker'), uploadCsv, importShiftsCsv);
router.get('/:id', getShiftById);
router.patch('/:id', requireRole('worker'), patchShift);
router.delete('/:id', requireRole('worker'), deleteShift);

export default router;
