import { badRequest } from '../lib/errors.js';
import {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  ADVOCATE_PATCH_STATUSES,
} from '../config.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asString(label, raw, { min = 1, max = 5000 } = {}) {
  if (raw === undefined || raw === null) {
    throw badRequest(`${label} is required`);
  }
  if (typeof raw !== 'string') throw badRequest(`${label} must be a string`);
  const v = raw.trim();
  if (v.length < min) throw badRequest(`${label} is required`);
  if (v.length > max) throw badRequest(`${label} must be <= ${max} chars`);
  return v;
}

export function validateGrievanceCreate(body) {
  const b = body || {};

  const platform = asString('platform', b.platform, { max: 100 });
  const category = asString('category', b.category, { max: 50 });
  if (!GRIEVANCE_CATEGORIES.includes(category)) {
    throw badRequest(`category must be one of ${GRIEVANCE_CATEGORIES.join(', ')}`);
  }
  const description = asString('description', b.description, { min: 5, max: 5000 });

  let anonymous = true;
  if (b.anonymous !== undefined) {
    if (typeof b.anonymous !== 'boolean') {
      throw badRequest('anonymous must be a boolean');
    }
    anonymous = b.anonymous;
  }

  return { platform, category, description, anonymous };
}

export function validateAdvocatePatch(body) {
  const b = body || {};
  const patch = {};

  if (b.status !== undefined) {
    if (!ADVOCATE_PATCH_STATUSES.includes(b.status)) {
      throw badRequest(
        `status must be one of ${ADVOCATE_PATCH_STATUSES.join(', ')}`
      );
    }
    patch.status = b.status;
  }

  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) throw badRequest('tags must be an array');
    const tags = b.tags.map((t, i) => {
      if (typeof t !== 'string' || !t.trim()) {
        throw badRequest(`tags[${i}] must be a non-empty string`);
      }
      return t.trim().toLowerCase();
    });
    patch.tags = Array.from(new Set(tags));
  }

  if (b.cluster_id !== undefined) {
    if (b.cluster_id === null) {
      patch.clusterId = null;
    } else if (typeof b.cluster_id !== 'string' || !b.cluster_id.trim()) {
      throw badRequest('cluster_id must be a non-empty string or null');
    } else {
      patch.clusterId = b.cluster_id.trim();
    }
  }

  if (Object.keys(patch).length === 0) {
    throw badRequest('no updatable fields provided');
  }

  return patch;
}

export function validateCommentCreate(body) {
  const b = body || {};
  const bodyText = asString('body', b.body, { min: 1, max: 5000 });
  return { body: bodyText };
}

export function validateListFilters(query) {
  const q = query || {};
  const filters = {};

  if (q.platform) filters.platform = String(q.platform).trim();
  if (q.category) {
    const c = String(q.category).trim();
    if (!GRIEVANCE_CATEGORIES.includes(c)) {
      throw badRequest(`category must be one of ${GRIEVANCE_CATEGORIES.join(', ')}`);
    }
    filters.category = c;
  }
  if (q.status) {
    const s = String(q.status).trim();
    if (!GRIEVANCE_STATUSES.includes(s)) {
      throw badRequest(`status must be one of ${GRIEVANCE_STATUSES.join(', ')}`);
    }
    filters.status = s;
  }
  if (q.cluster_id) filters.clusterId = String(q.cluster_id).trim();

  filters.page = Math.max(1, Number(q.page) || 1);
  filters.pageSize = Math.min(200, Math.max(1, Number(q.page_size) || 50));

  return filters;
}

export function validateUuidParam(label, value) {
  if (!value || !UUID_RE.test(value)) {
    throw badRequest(`${label} must be a valid uuid`);
  }
  return value;
}
