import { JACCARD_THRESHOLD } from '../config.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'of', 'to', 'in',
  'on', 'at', 'by', 'for', 'with', 'from', 'as', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'can', 'may', 'might', 'this', 'that', 'these',
  'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
  'they', 'them', 'their', 'his', 'her', 'not', 'no', 'yes', 'also', 'any',
  'some', 'all', 'just', 'very', 'too', 'than', 'about',
]);

export function tokenize(text) {
  if (!text) return new Set();
  const tokens = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

export function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function bucketKey(g) {
  return `${g.platform}::${g.category}`;
}

export function buildClusters(grievances, threshold = JACCARD_THRESHOLD) {
  const buckets = new Map();
  for (const g of grievances) {
    const key = bucketKey(g);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push({ ...g, tokens: tokenize(g.description) });
  }

  const clusters = [];
  let clusterCounter = 1;

  for (const [key, items] of buckets) {
    const [platform, category] = key.split('::');
    const visited = new Array(items.length).fill(false);

    for (let i = 0; i < items.length; i++) {
      if (visited[i]) continue;

      const group = [items[i]];
      visited[i] = true;

      for (let j = i + 1; j < items.length; j++) {
        if (visited[j]) continue;
        const score = jaccard(items[i].tokens, items[j].tokens);
        if (score >= threshold) {
          group.push(items[j]);
          visited[j] = true;
        }
      }

      if (group.length >= 2) {
        clusters.push({
          cluster_id: `auto-${clusterCounter++}`,
          platform,
          category,
          count: group.length,
          sample_ids: group.slice(0, 5).map((g) => g.id),
        });
      }
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  return clusters;
}
