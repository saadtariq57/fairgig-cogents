import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 8002,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
  },
  uploads: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 5,
  },
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  internalApiKey: process.env.INTERNAL_API_KEY || 'change-me-too',
};

export const PLATFORMS = ['Careem', 'InDrive', 'Foodpanda', 'Bykea', 'Uber', 'Other'];

export const SHIFT_EDITABLE_STATUSES = ['unverified'];

export const VERIFICATION_REVIEW_STATUSES = ['confirmed', 'flagged', 'unverifiable'];
