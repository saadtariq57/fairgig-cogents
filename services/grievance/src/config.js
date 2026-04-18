import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 8004,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
  },
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  internalApiKey: process.env.INTERNAL_API_KEY || 'change-me-too',
};

export const GRIEVANCE_CATEGORIES = [
  'commission_change',
  'sudden_deactivation',
  'unpaid_earnings',
  'rate_drop',
  'other',
];

export const GRIEVANCE_STATUSES = ['open', 'escalated', 'resolved'];

export const ADVOCATE_PATCH_STATUSES = ['escalated', 'resolved'];

export const JACCARD_THRESHOLD = 0.3;
