import { verifyToken } from '../lib/tokens.js';
import { unauthorized } from '../lib/errors.js';

export function requireAuth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(unauthorized('Missing bearer token'));

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(unauthorized('Wrong role for this action'));
    }
    next();
  };
}
