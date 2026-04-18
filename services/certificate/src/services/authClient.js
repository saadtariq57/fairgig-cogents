import axios from 'axios';
import { config } from '../config.js';
import { unauthorized, notFound, upstreamError } from '../lib/errors.js';

// resolves caller
export async function fetchCallerProfile(authHeader) {
  try {
    const res = await axios.get(`${config.authServiceUrl}/auth/me`, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw unauthorized('Auth token rejected by auth service');
    }
    throw upstreamError(`Auth /me failed: ${err.message}`);
  }
}

// resolves any worker
export async function fetchWorkerProfile(workerId) {
  try {
    const res = await axios.get(`${config.authServiceUrl}/auth/internal/users/${workerId}`, {
      headers: { 'x-internal-api-key': config.internalApiKey },
      timeout: 5000,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) throw notFound('Worker not found');
    const msg = err.response?.data?.error?.message || err.message;
    throw upstreamError(`Auth internal lookup failed: ${msg}`);
  }
}
