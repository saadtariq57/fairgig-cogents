import axios from 'axios';
import { config } from '../config.js';
import { upstreamError } from '../lib/errors.js';

export async function fetchVerifiedShifts({ workerId, from, to }) {
  try {
    const res = await axios.get(`${config.earningsServiceUrl}/internal/shifts/verified`, {
      params: { worker_id: workerId, from, to },
      headers: { 'x-internal-api-key': config.internalApiKey },
      timeout: 8000,
    });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    throw upstreamError(`Earnings service failed: ${msg}`);
  }
}
