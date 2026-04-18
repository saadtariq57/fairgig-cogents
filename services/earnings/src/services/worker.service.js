import axios from 'axios';
import { config } from '../config.js';
import { getWorkerTotals } from './shift.service.js';
import { notFound } from '../lib/errors.js';

export async function buildWorkerProfile(workerId, callerAuthHeader) {
  const authUser = await fetchAuthProfile(callerAuthHeader);

  const targetId = authUser.id === workerId ? authUser.id : workerId;

  const totals = await getWorkerTotals(targetId);

  return {
    worker_id: targetId,
    name: authUser.id === targetId ? authUser.name : null,
    city_zone: authUser.id === targetId ? authUser.city_zone : null,
    category: authUser.id === targetId ? authUser.category : null,
    totals,
  };
}

async function fetchAuthProfile(authHeader) {
  try {
    const res = await axios.get(`${config.authServiceUrl}/auth/me`, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) throw notFound('Auth user lookup failed');
    throw err;
  }
}
