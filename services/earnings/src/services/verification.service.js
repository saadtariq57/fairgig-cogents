import fs from 'fs';
import { prisma } from '../prisma.js';
import { notFound, forbidden, conflict } from '../lib/errors.js';

export async function submitVerification({ workerId, shiftId, screenshotPath }) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) {
    await safeUnlink(screenshotPath);
    throw notFound('Shift not found');
  }
  if (shift.workerId !== workerId) {
    await safeUnlink(screenshotPath);
    throw forbidden('Not your shift');
  }
  if (shift.verificationStatus === 'confirmed') {
    await safeUnlink(screenshotPath);
    throw conflict('Shift already confirmed');
  }

  const [verification] = await prisma.$transaction([
    prisma.verification.create({
      data: {
        shiftId,
        workerId,
        screenshotPath,
        status: 'pending_review',
      },
    }),
    prisma.shift.update({
      where: { id: shiftId },
      data: { verificationStatus: 'pending_review' },
    }),
  ]);

  return verification;
}

export async function listVerifications({ status }) {
  const where = {};
  if (status) where.status = status;

  const items = await prisma.verification.findMany({
    where,
    include: { shift: true },
    orderBy: [{ submittedAt: 'desc' }],
  });

  return items;
}

export async function reviewVerification({ verifierId, verificationId, status, reviewerNote }) {
  const existing = await prisma.verification.findUnique({ where: { id: verificationId } });
  if (!existing) throw notFound('Verification not found');
  if (existing.status !== 'pending_review') {
    throw conflict('Verification has already been reviewed');
  }

  const [updated] = await prisma.$transaction([
    prisma.verification.update({
      where: { id: verificationId },
      data: {
        status,
        reviewerNote,
        verifierId,
        reviewedAt: new Date(),
      },
    }),
    prisma.shift.update({
      where: { id: existing.shiftId },
      data: { verificationStatus: status },
    }),
  ]);

  return updated;
}

async function safeUnlink(path) {
  try { await fs.promises.unlink(path); } catch { /* ignore */ }
}
