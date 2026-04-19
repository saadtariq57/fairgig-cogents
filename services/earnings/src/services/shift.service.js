import { prisma } from '../prisma.js';
import { notFound, forbidden, conflict } from '../lib/errors.js';
import { SHIFT_EDITABLE_STATUSES } from '../config.js';

export async function createShift(workerId, data) {
  return prisma.shift.create({
    data: {
      workerId,
      platform: data.platform,
      shiftDate: data.shiftDate,
      hoursWorked: data.hoursWorked,
      grossEarned: data.grossEarned,
      platformDeductions: data.platformDeductions,
      netReceived: data.netReceived,
      notes: data.notes,
    },
  });
}

export async function listShifts(user, filters) {
  const where = {};

  if (user.role === 'worker') {
    where.workerId = user.id;
  } else if (user.role === 'verifier') {
    if (filters.workerId) where.workerId = filters.workerId;
  } else if (user.role === 'advocate') {
    if (filters.workerId) where.workerId = filters.workerId;
  }

  if (filters.platform) where.platform = filters.platform;
  if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
  if (filters.from || filters.to) {
    where.shiftDate = {};
    if (filters.from) where.shiftDate.gte = filters.from;
    if (filters.to) where.shiftDate.lte = filters.to;
  }

  const [items, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      orderBy: [{ shiftDate: 'desc' }, { createdAt: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.shift.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getShiftForUser(user, shiftId) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw notFound('Shift not found');

  if (user.role === 'worker' && shift.workerId !== user.id) {
    throw forbidden('You can only view your own shifts');
  }
  return shift;
}

export async function updateOwnShift(workerId, shiftId, patch) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw notFound('Shift not found');
  if (shift.workerId !== workerId) throw forbidden('Not your shift');

  if (!SHIFT_EDITABLE_STATUSES.includes(shift.verificationStatus)) {
    throw conflict('Shift cannot be edited after verification has started');
  }

  return prisma.shift.update({ where: { id: shiftId }, data: patch });
}

export async function deleteOwnShift(workerId, shiftId) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw notFound('Shift not found');
  if (shift.workerId !== workerId) throw forbidden('Not your shift');
  if (!SHIFT_EDITABLE_STATUSES.includes(shift.verificationStatus)) {
    throw conflict('Shift cannot be deleted after verification has started');
  }

  await prisma.shift.delete({ where: { id: shiftId } });
}

export async function bulkCreateShifts(workerId, rows) {
  const imported = [];
  const skipped = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const shift = await prisma.shift.create({
        data: {
          workerId,
          platform: row.platform,
          shiftDate: row.shiftDate,
          hoursWorked: row.hoursWorked,
          grossEarned: row.grossEarned,
          platformDeductions: row.platformDeductions,
          netReceived: row.netReceived,
          notes: row.notes,
        },
      });
      imported.push(shift.id);
    } catch (err) {
      skipped.push({ row: i + 2, reason: err.message });
    }
  }

  return { imported: imported.length, skipped };
}

export async function getWorkerTotals(workerId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalShifts, verifiedShifts, netAgg] = await Promise.all([
    prisma.shift.count({ where: { workerId } }),
    prisma.shift.count({ where: { workerId, verificationStatus: 'confirmed' } }),
    prisma.shift.aggregate({
      where: { workerId, shiftDate: { gte: thirtyDaysAgo } },
      _sum: { netReceived: true },
    }),
  ]);

  return {
    shifts: totalShifts,
    verified_shifts: verifiedShifts,
    net_earned_last_30d: Number(netAgg._sum.netReceived || 0),
  };
}
