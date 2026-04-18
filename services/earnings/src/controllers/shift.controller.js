import {
  createShift,
  listShifts,
  getShiftForUser,
  updateOwnShift,
  deleteOwnShift,
  bulkCreateShifts,
} from '../services/shift.service.js';
import {
  validateShiftCreate,
  validateShiftUpdate,
  validateListFilters,
} from '../validators/shift.schema.js';
import { parseShiftsCsv } from '../services/csv.service.js';
import { badRequest } from '../lib/errors.js';
import { shiftToApi } from '../lib/money.js';

export async function postShift(req, res, next) {
  try {
    const input = validateShiftCreate(req.body);
    const shift = await createShift(req.user.id, input);
    res.status(201).json(shiftToApi(shift));
  } catch (err) { next(err); }
}

export async function getShifts(req, res, next) {
  try {
    const filters = validateListFilters(req.query);
    const { items, total, page, pageSize } = await listShifts(req.user, filters);
    res.json({
      items: items.map(shiftToApi),
      total,
      page,
      page_size: pageSize,
    });
  } catch (err) { next(err); }
}

export async function getShiftById(req, res, next) {
  try {
    const shift = await getShiftForUser(req.user, req.params.id);
    res.json(shiftToApi(shift));
  } catch (err) { next(err); }
}

export async function patchShift(req, res, next) {
  try {
    const patch = validateShiftUpdate(req.body);
    const shift = await updateOwnShift(req.user.id, req.params.id, patch);
    res.json(shiftToApi(shift));
  } catch (err) { next(err); }
}

export async function deleteShift(req, res, next) {
  try {
    await deleteOwnShift(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function importShiftsCsv(req, res, next) {
  try {
    if (!req.file) throw badRequest('file is required (multipart field "file")');

    const { rows, skipped } = parseShiftsCsv(req.file.buffer);
    const result = await bulkCreateShifts(req.user.id, rows);

    res.status(201).json({
      imported: result.imported,
      skipped: [...skipped, ...result.skipped],
    });
  } catch (err) { next(err); }
}
