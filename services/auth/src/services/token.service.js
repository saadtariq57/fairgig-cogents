import { prisma } from '../prisma.js';
import {
  signAccess,
  signRefresh,
  verifyToken,
  hashToken,
  refreshExpiryDate,
} from '../lib/tokens.js';
import { unauthorized } from '../lib/errors.js';

export async function issueTokenPair(user) {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function consumeRefreshToken(refreshToken) {
  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw unauthorized('Invalid refresh token');
  }
  if (payload.type !== 'refresh') throw unauthorized('Wrong token type');

  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash: hashToken(refreshToken), revoked: false },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw unauthorized('Refresh token not valid');
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  return payload.sub;
}
