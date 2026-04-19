export function maskWorkerId(workerId) {
  if (!workerId) return null;
  return `w_${workerId.slice(0, 6)}`;
}

function displayName(name) {
  if (!name) return 'Worker';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function grievanceToApi(g) {
  const isAnon = g.anonymous === true;

  return {
    id: g.id,
    worker_id: isAnon ? null : g.workerId,
    worker_id_masked: maskWorkerId(g.workerId),
    anonymous: isAnon,
    author_display: isAnon ? 'Anonymous' : displayName(g.authorName),
    platform: g.platform,
    category: g.category,
    description: g.description,
    status: g.status,
    tags: g.tags || [],
    cluster_id: g.clusterId || null,
    upvotes: g.upvotes ?? 0,
    posted_at: g.postedAt?.toISOString(),
    updated_at: g.updatedAt?.toISOString(),
  };
}

export function commentToApi(c) {
  return {
    id: c.id,
    grievance_id: c.grievanceId,
    author_id: c.authorId,
    body: c.body,
    created_at: c.createdAt?.toISOString(),
  };
}
