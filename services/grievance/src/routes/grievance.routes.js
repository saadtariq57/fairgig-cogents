import { Router } from 'express';
import {
  postGrievance,
  getGrievances,
  getGrievance,
  patchGrievance,
  postComment,
  getClusters,
  upvoteGrievance,
} from '../controllers/grievance.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/clusters', requireRole('advocate'), getClusters);

router.post('/', requireRole('worker', 'verifier', 'advocate'), postGrievance);
router.get('/', getGrievances);
router.get('/:id', getGrievance);
router.patch('/:id', requireRole('advocate'), patchGrievance);
router.post('/:id/upvote', upvoteGrievance);
router.post('/:id/comments', requireRole('advocate'), postComment);

export default router;
