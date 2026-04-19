import {
  createGrievance,
  listGrievances,
  getGrievanceById,
  updateGrievance,
  addComment,
  computeClusters,
  incrementUpvote,
} from '../services/grievance.service.js';
import {
  validateGrievanceCreate,
  validateAdvocatePatch,
  validateCommentCreate,
  validateListFilters,
  validateUuidParam,
} from '../validators/grievance.schema.js';
import { grievanceToApi, commentToApi } from '../lib/dto.js';
import { fetchCallerProfile } from '../lib/authClient.js';

export async function postGrievance(req, res, next) {
  try {
    const input = validateGrievanceCreate(req.body);

    let authorName = null;
    if (!input.anonymous) {
      const profile = await fetchCallerProfile(req.headers.authorization);
      authorName = profile?.name || null;
    }

    const g = await createGrievance({
      workerId: req.user.id,
      authorName,
      data: input,
    });
    res.status(201).json(grievanceToApi(g));
  } catch (err) { next(err); }
}

export async function getGrievances(req, res, next) {
  try {
    const filters = validateListFilters(req.query);
    const { items, total, page, pageSize } = await listGrievances(filters);
    res.json({
      items: items.map(grievanceToApi),
      total,
      page,
      page_size: pageSize,
    });
  } catch (err) { next(err); }
}

export async function getGrievance(req, res, next) {
  try {
    const id = validateUuidParam('id', req.params.id);
    const g = await getGrievanceById(id);
    res.json({
      ...grievanceToApi(g),
      comments: (g.comments || []).map(commentToApi),
    });
  } catch (err) { next(err); }
}

export async function patchGrievance(req, res, next) {
  try {
    const id = validateUuidParam('id', req.params.id);
    const patch = validateAdvocatePatch(req.body);
    const g = await updateGrievance(id, patch);
    res.json(grievanceToApi(g));
  } catch (err) { next(err); }
}

export async function postComment(req, res, next) {
  try {
    const grievanceId = validateUuidParam('id', req.params.id);
    const input = validateCommentCreate(req.body);
    const comment = await addComment({
      grievanceId,
      authorId: req.user.id,
      body: input.body,
    });
    res.status(201).json(commentToApi(comment));
  } catch (err) { next(err); }
}

export async function getClusters(_req, res, next) {
  try {
    const clusters = await computeClusters();
    res.json({ clusters });
  } catch (err) { next(err); }
}

export async function upvoteGrievance(req, res, next) {
  try {
    const id = validateUuidParam('id', req.params.id);
    const g = await incrementUpvote(id);
    res.json({ id: g.id, upvotes: g.upvotes });
  } catch (err) { next(err); }
}
