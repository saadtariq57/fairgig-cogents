import {
  createUser,
  authenticate,
  getActiveUser,
  getUserProfile,
  toPublicProfile,
} from '../services/user.service.js';
import { issueTokenPair, consumeRefreshToken } from '../services/token.service.js';
import {
  validateRegister,
  validateLogin,
  validateRefresh,
} from '../validators/auth.schema.js';

export async function register(req, res, next) {
  try {
    const input = validateRegister(req.body);
    const user = await createUser(input);
    res.status(201).json({ user_id: user.id, email: user.email, role: user.role });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = validateLogin(req.body);
    const user = await authenticate(email, password);
    const { accessToken, refreshToken } = await issueTokenPair(user);
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, role: user.role, name: user.name },
    });
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = validateRefresh(req.body);
    const userId = await consumeRefreshToken(refreshToken);
    const user = await getActiveUser(userId);
    const pair = await issueTokenPair(user);
    res.json({ access_token: pair.accessToken, refresh_token: pair.refreshToken });
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const user = await getUserProfile(req.user.id);
    res.json(toPublicProfile(user));
  } catch (err) { next(err); }
}
