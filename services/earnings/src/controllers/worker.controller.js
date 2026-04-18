import { buildWorkerProfile } from '../services/worker.service.js';
import { forbidden } from '../lib/errors.js';

export async function getWorkerProfile(req, res, next) {
  try {
    const { worker_id: workerId } = req.params;

    if (req.user.role === 'worker' && req.user.id !== workerId) {
      throw forbidden('Workers can only view their own profile');
    }

    const profile = await buildWorkerProfile(workerId, req.headers.authorization);
    res.json(profile);
  } catch (err) { next(err); }
}
