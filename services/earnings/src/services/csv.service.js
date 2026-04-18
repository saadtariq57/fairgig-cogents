import { parse } from 'csv-parse/sync';
import { csvError } from '../lib/errors.js';

const REQUIRED_HEADERS = [
  'platform',
  'date',
  'hours_worked',
  'gross_earned',
  'platform_deductions',
  'net_received',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseShiftsCsv(buffer) {
  let records;
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (err) {
    throw csvError('Could not parse CSV', { reason: err.message });
  }

  if (!records.length) throw csvError('CSV has no rows');

  const headers = Object.keys(records[0]);
  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      throw csvError(`Missing required header: ${h}`, { expected: REQUIRED_HEADERS });
    }
  }

  const rows = [];
  const skipped = [];

  records.forEach((r, idx) => {
    const rowNum = idx + 2;
    try {
      const row = normalizeRow(r);
      rows.push(row);
    } catch (err) {
      skipped.push({ row: rowNum, reason: err.message });
    }
  });

  return { rows, skipped };
}

function normalizeRow(r) {
  if (!r.platform) throw new Error('platform is empty');
  if (!DATE_RE.test(r.date)) throw new Error('date must be YYYY-MM-DD');

  const hours = Number(r.hours_worked);
  const gross = Number(r.gross_earned);
  const deductions = Number(r.platform_deductions);
  const net = Number(r.net_received);

  if ([hours, gross, deductions, net].some(Number.isNaN)) {
    throw new Error('numeric fields must be numbers');
  }
  if (hours <= 0 || hours > 24) throw new Error('hours_worked must be between 0 and 24');
  if (gross < 0 || deductions < 0 || net < 0) throw new Error('amounts must be >= 0');
  if (Math.abs(gross - deductions - net) > 1) {
    throw new Error('net_received must equal gross_earned - platform_deductions');
  }

  return {
    platform: r.platform.trim(),
    shiftDate: new Date(`${r.date}T00:00:00Z`),
    hoursWorked: hours,
    grossEarned: gross,
    platformDeductions: deductions,
    netReceived: net,
    notes: r.notes ? String(r.notes).trim() : null,
  };
}
