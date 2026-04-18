import crypto from 'crypto';

// footer tamper-check
export function verificationHash({ workerId, from, to, totals }) {
  const parts = [
    workerId,
    from,
    to,
    totals.gross.toFixed(2),
    totals.deductions.toFixed(2),
    totals.net.toFixed(2),
  ];
  const input = parts.join('|');
  return crypto.createHash('sha256').update(input).digest('hex');
}
