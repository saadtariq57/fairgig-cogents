import { verifyAccessToken } from '../lib/tokens.js';
import { unauthorized } from '../lib/errors.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized('Missing bearer token'));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    req.bearer = token;
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}
