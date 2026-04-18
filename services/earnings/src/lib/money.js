import { Prisma } from '@prisma/client';

export function toDecimal(value) {
  return new Prisma.Decimal(value);
}

export function decimalToNumber(d) {
  if (d === null || d === undefined) return null;
  return Number(d);
}

export function shiftToApi(shift) {
  return {
    id: shift.id,
    worker_id: shift.workerId,
    platform: shift.platform,
    date: shift.shiftDate.toISOString().slice(0, 10),
    hours_worked: decimalToNumber(shift.hoursWorked),
    gross_earned: decimalToNumber(shift.grossEarned),
    platform_deductions: decimalToNumber(shift.platformDeductions),
    net_received: decimalToNumber(shift.netReceived),
    notes: shift.notes,
    verification_status: shift.verificationStatus,
    created_at: shift.createdAt?.toISOString(),
    updated_at: shift.updatedAt?.toISOString(),
  };
}

export function verificationToApi(v) {
  return {
    id: v.id,
    shift_id: v.shiftId,
    worker_id: v.workerId,
    verifier_id: v.verifierId,
    screenshot_url: `/uploads/${v.screenshotPath.split(/[\\/]/).pop()}`,
    status: v.status,
    reviewer_note: v.reviewerNote,
    submitted_at: v.submittedAt?.toISOString(),
    reviewed_at: v.reviewedAt?.toISOString() || null,
  };
}
