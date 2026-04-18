import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { config } from '../config.js';

fs.mkdirSync(config.uploads.dir, { recursive: true });

const screenshotStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploads.dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

function imageFilter(_req, file, cb) {
  const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
  if (!ok) return cb(new Error('Only image uploads are allowed'));
  cb(null, true);
}

export const uploadScreenshot = multer({
  storage: screenshotStorage,
  limits: { fileSize: config.uploads.maxMb * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('file');

export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okMime = /csv|text\/plain|application\/vnd.ms-excel/i.test(file.mimetype);
    const okExt = /\.csv$/i.test(file.originalname || '');
    if (!okMime && !okExt) return cb(new Error('Only CSV files allowed'));
    cb(null, true);
  },
}).single('file');
