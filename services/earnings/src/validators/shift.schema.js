import { badRequest } from '../lib/errors.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(label, raw, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (raw === undefined || raw === null || raw === '') {
    throw badRequest(`${label} is required`);
  }
  const n = Number(raw);
  if (Number.isNaN(n)) throw badRequest(`${label} must be a number`);
  if (n < min) throw badRequest(`${label} must be >= ${min}`);
  if (n > max) throw badRequest(`${label} must be <= ${max}`);
  return n;
}

function checkMathInvariant({ gross, deductions, net }) {
  const diff = Math.abs(gross - deductions - net);
  if (diff > 1) {
    throw badRequest('net_received must equal gross_earned - platform_deductions (±1 PKR)');
  }
}

export function validateShiftCreate(body) {
  const b = body || {};
  if (!b.platform || typeof b.platform !== 'string') {
    throw badRequest('platform is required');
  }
  if (!b.date || !DATE_RE.test(b.date)) {
    throw badRequest('date must be YYYY-MM-DD');
  }

  const hours = toNumber('hours_worked', b.hours_worked, { min: 0.01, max: 24 });
  const gross = toNumber('gross_earned', b.gross_earned, { min: 0 });
  const deductions = toNumber('platform_deductions', b.platform_deductions, { min: 0 });
  const net = toNumber('net_received', b.net_received, { min: 0 });

  checkMathInvariant({ gross, deductions, net });

  return {
    platform: b.platform.trim(),
    shiftDate: new Date(`${b.date}T00:00:00Z`),
    hoursWorked: hours,
    grossEarned: gross,
    platformDeductions: deductions,
    netReceived: net,
    notes: typeof b.notes === 'string' ? b.notes.trim() : null,
  };
}

export function validateShiftUpdate(body) {
  const b = body || {};
  const patch = {};

  if (b.platform !== undefined) {
    if (typeof b.platform !== 'string' || !b.platform.trim()) {
      throw badRequest('platform must be a non-empty string');
    }
    patch.platform = b.platform.trim();
  }

  if (b.date !== undefined) {
    if (!DATE_RE.test(b.date)) throw badRequest('date must be YYYY-MM-DD');
    patch.shiftDate = new Date(`${b.date}T00:00:00Z`);
  }

  if (b.hours_worked !== undefined) {
    patch.hoursWorked = toNumber('hours_worked', b.hours_worked, { min: 0.01, max: 24 });
  }
  if (b.gross_earned !== undefined) {
    patch.grossEarned = toNumber('gross_earned', b.gross_earned, { min: 0 });
  }
  if (b.platform_deductions !== undefined) {
    patch.platformDeductions = toNumber('platform_deductions', b.platform_deductions, { min: 0 });
  }
  if (b.net_received !== undefined) {
    patch.netReceived = toNumber('net_received', b.net_received, { min: 0 });
  }
  if (b.notes !== undefined) {
    patch.notes = b.notes === null ? null : String(b.notes);
  }

  return patch;
}

export function validateListFilters(query) {
  const q = query || {};
  const filters = {};

  if (q.from) {
    if (!DATE_RE.test(q.from)) throw badRequest('from must be YYYY-MM-DD');
    filters.from = new Date(`${q.from}T00:00:00.000Z`);
    if (isNaN(filters.from.getTime())) throw badRequest('from is not a valid date');
  }
  if (q.to) {
    if (!DATE_RE.test(q.to)) throw badRequest('to must be YYYY-MM-DD');
    filters.to = new Date(`${q.to}T23:59:59.999Z`);
    if (isNaN(filters.to.getTime())) throw badRequest('to is not a valid date');
  }
  if (q.platform) filters.platform = String(q.platform).trim();
  if (q.worker_id) filters.workerId = String(q.worker_id);

  const VALID_STATUSES = ['unverified', 'pending_review', 'confirmed', 'flagged', 'unverifiable'];
  if (q.verification_status) {
    if (!VALID_STATUSES.includes(q.verification_status)) {
      throw badRequest(`verification_status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    filters.verificationStatus = q.verification_status;
  }

  filters.page = Math.max(1, Number(q.page) || 1);
  filters.pageSize = Math.min(200, Math.max(1, Number(q.page_size) || 50));

  return filters;
}
