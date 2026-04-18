import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';

export function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: `${config.jwt.accessMinutes}m` }
  );
}

export function signRefresh(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: `${config.jwt.refreshDays}d` }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + config.jwt.refreshDays);
  return d;
}
