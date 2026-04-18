import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 8006,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
  },
  internalApiKey: process.env.INTERNAL_API_KEY || 'change-me-too',
  earningsServiceUrl: process.env.EARNINGS_SERVICE_URL || 'http://localhost:8002',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
};
