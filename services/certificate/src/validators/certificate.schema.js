import { badRequest } from '../lib/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateCertificateQuery(query) {
  const q = query || {};

  const workerId = String(q.worker_id || '');
  const from = String(q.from || '');
  const to = String(q.to || '');

  if (!UUID_RE.test(workerId)) throw badRequest('worker_id must be a valid uuid');
  if (!DATE_RE.test(from)) throw badRequest('from must be YYYY-MM-DD');
  if (!DATE_RE.test(to)) throw badRequest('to must be YYYY-MM-DD');
  if (from > to) throw badRequest('from must be <= to');

  return { workerId, from, to };
}
