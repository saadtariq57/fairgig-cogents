import axios from 'axios';
import { config } from '../config.js';

export async function fetchCallerProfile(authHeader) {
  if (!authHeader) return null;
  try {
    const res = await axios.get(`${config.authServiceUrl}/auth/me`, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });
    return res.data;
  } catch {
    return null;
  }
}
