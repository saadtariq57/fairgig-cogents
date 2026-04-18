import 'dotenv/config';

/** Comma-separated list in FRONTEND_ORIGIN, e.g. "http://localhost:3000,http://127.0.0.1:3000" */
function parseFrontendOrigins() {
  const raw = process.env.FRONTEND_ORIGIN;
  if (!raw || !raw.trim()) {
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT) || 8001,
  /** Allowed browser origins for CORS (Next.js dev is often opened as localhost or 127.0.0.1). */
  frontendOrigins: parseFrontendOrigins(),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    accessMinutes: Number(process.env.JWT_ACCESS_TOKEN_EXPIRY_MIN) || 60,
    refreshDays: Number(process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS) || 7,
  },
  bcryptRounds: 10,
  internalApiKey: process.env.INTERNAL_API_KEY || 'change-me-too',
};

export const ROLES = ['worker', 'verifier', 'advocate'];
export const CATEGORIES = ['ride_hailing', 'delivery', 'freelance', 'domestic'];
