import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 8001,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
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
