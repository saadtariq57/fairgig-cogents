import { prisma } from '../prisma.js';
import { notFound } from '../lib/errors.js';
import { buildClusters } from '../lib/cluster.js';

export async function createGrievance({ workerId, authorName, data }) {
  return prisma.grievance.create({
    data: {
      workerId,
      authorName: data.anonymous ? null : authorName || null,
      anonymous: data.anonymous,
      platform: data.platform,
      category: data.category,
      description: data.description,
    },
  });
}

export async function listGrievances(filters) {
  const where = {};
  if (filters.platform) where.platform = filters.platform;
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;
  if (filters.clusterId) where.clusterId = filters.clusterId;

  const [items, total] = await Promise.all([
    prisma.grievance.findMany({
      where,
      orderBy: [{ postedAt: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.grievance.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getGrievanceById(id) {
  const g = await prisma.grievance.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!g) throw notFound('Grievance not found');
  return g;
}

export async function updateGrievance(id, patch) {
  const existing = await prisma.grievance.findUnique({ where: { id } });
  if (!existing) throw notFound('Grievance not found');

  return prisma.grievance.update({
    where: { id },
    data: patch,
  });
}

export async function addComment({ grievanceId, authorId, body }) {
  const existing = await prisma.grievance.findUnique({ where: { id: grievanceId } });
  if (!existing) throw notFound('Grievance not found');

  return prisma.grievanceComment.create({
    data: { grievanceId, authorId, body },
  });
}

export async function computeClusters() {
  const all = await prisma.grievance.findMany({
    select: { id: true, platform: true, category: true, description: true },
  });
  return buildClusters(all);
}
