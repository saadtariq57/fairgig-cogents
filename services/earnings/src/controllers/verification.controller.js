import {
  submitVerification,
  listVerifications,
  reviewVerification,
} from '../services/verification.service.js';
import {
  validateShiftIdField,
  validateReviewPatch,
} from '../validators/verification.schema.js';
import { badRequest } from '../lib/errors.js';
import { shiftToApi, verificationToApi } from '../lib/money.js';

export async function postVerification(req, res, next) {
  try {
    if (!req.file) throw badRequest('file is required (multipart field "file")');
    const shiftId = validateShiftIdField(req.body);

    const verification = await submitVerification({
      workerId: req.user.id,
      shiftId,
      screenshotPath: req.file.path,
    });

    res.status(201).json(verificationToApi(verification));
  } catch (err) { next(err); }
}

export async function getVerifications(req, res, next) {
  try {
    const status = req.query.status || 'pending_review';
    const items = await listVerifications({ status });

    res.json({
      items: items.map((v) => ({
        ...verificationToApi(v),
        shift: v.shift ? maskWorker(shiftToApi(v.shift)) : null,
      })),
    });
  } catch (err) { next(err); }
}

export async function patchVerification(req, res, next) {
  try {
    const patch = validateReviewPatch(req.body);
    const updated = await reviewVerification({
      verifierId: req.user.id,
      verificationId: req.params.id,
      ...patch,
    });
    res.json(verificationToApi(updated));
  } catch (err) { next(err); }
}

function maskWorker(shift) {
  if (!shift?.worker_id) return shift;
  return { ...shift, worker_id: `w_${shift.worker_id.slice(0, 6)}` };
}
