import { fetchVerifiedShifts } from './earningsClient.js';
import { fetchCallerProfile, fetchWorkerProfile } from './authClient.js';
import { forbidden } from '../lib/errors.js';
import { verificationHash } from '../lib/hash.js';

// role-based access check
function assertCanView(caller, workerId) {
  if (caller.role === 'worker' && caller.id !== workerId) {
    throw forbidden('Workers can only view their own certificate');
  }
  // advocates and verifiers pass
}

function sumBreakdown(items) {
  const totals = { gross: 0, deductions: 0, net: 0, shifts: items.length };
  const byPlatform = new Map();

  for (const s of items) {
    totals.gross += Number(s.gross_earned || 0);
    totals.deductions += Number(s.platform_deductions || 0);
    totals.net += Number(s.net_received || 0);

    const key = s.platform || 'Other';
    const row = byPlatform.get(key) || { platform: key, shifts: 0, gross: 0, deductions: 0, net: 0 };
    row.shifts += 1;
    row.gross += Number(s.gross_earned || 0);
    row.deductions += Number(s.platform_deductions || 0);
    row.net += Number(s.net_received || 0);
    byPlatform.set(key, row);
  }

  const platforms = [...byPlatform.values()].sort((a, b) => b.net - a.net);
  return { totals, platforms };
}

export async function buildCertificate({ caller, bearer, workerId, from, to }) {
  assertCanView(caller, workerId);

  // pick the cheaper path for self
  let worker;
  if (caller.id === workerId) {
    worker = await fetchCallerProfile(`Bearer ${bearer}`);
  } else {
    worker = await fetchWorkerProfile(workerId);
  }

  const shifts = await fetchVerifiedShifts({ workerId, from, to });
  const { totals, platforms } = sumBreakdown(shifts.items || []);

  const hash = verificationHash({ workerId, from, to, totals });

  return {
    worker: {
      id: workerId,
      name: worker?.name || 'Unknown Worker',
      category: worker?.category || null,
      city_zone: worker?.city_zone || null,
    },
    range: { from, to },
    totals,
    platforms,
    generated_at: new Date().toISOString(),
    hash,
  };
}
