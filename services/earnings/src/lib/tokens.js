import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
