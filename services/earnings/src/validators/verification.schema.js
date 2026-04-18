import { badRequest } from '../lib/errors.js';
import { VERIFICATION_REVIEW_STATUSES } from '../config.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateShiftIdField(body) {
  const shiftId = body?.shift_id;
  if (!shiftId || !UUID_RE.test(shiftId)) {
    throw badRequest('shift_id must be a valid uuid');
  }
  return shiftId;
}

export function validateReviewPatch(body) {
  const b = body || {};
  if (!b.status || !VERIFICATION_REVIEW_STATUSES.includes(b.status)) {
    throw badRequest(
      `status must be one of ${VERIFICATION_REVIEW_STATUSES.join(', ')}`
    );
  }
  return {
    status: b.status,
    reviewerNote: typeof b.reviewer_note === 'string' ? b.reviewer_note.trim() : null,
  };
}
