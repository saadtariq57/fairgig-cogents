import { ROLES, CATEGORIES } from '../config.js';
import { badRequest } from '../lib/errors.js';

export function validateRegister(body) {
  const { email, password, name, role, city_zone, category } = body || {};

  if (!email || !password || !role) throw badRequest('email, password, role are required');
  if (!ROLES.includes(role)) throw badRequest(`role must be one of ${ROLES.join(', ')}`);
  if (password.length < 6) throw badRequest('password must be at least 6 chars');

  if (role === 'worker') {
    if (!city_zone || !category) throw badRequest('city_zone and category are required for workers');
    if (!CATEGORIES.includes(category)) throw badRequest(`category must be one of ${CATEGORIES.join(', ')}`);
  }

  return {
    email,
    password,
    name: name || null,
    role,
    cityZone: role === 'worker' ? city_zone : null,
    category: role === 'worker' ? category : null,
  };
}

export function validateLogin(body) {
  const { email, password } = body || {};
  if (!email || !password) throw badRequest('email and password are required');
  return { email, password };
}

export function validateRefresh(body) {
  const { refresh_token } = body || {};
  if (!refresh_token) throw badRequest('refresh_token is required');
  return { refreshToken: refresh_token };
}
