import { validateCertificateQuery } from '../validators/certificate.schema.js';
import { buildCertificate } from '../services/certificate.service.js';

export async function getCertificate(req, res, next) {
  try {
    const { workerId, from, to } = validateCertificateQuery(req.query);

    const data = await buildCertificate({
      caller: req.user,
      bearer: req.bearer,
      workerId,
      from,
      to,
    });

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.render('certificate', { c: data });
  } catch (err) {
    next(err);
  }
}
