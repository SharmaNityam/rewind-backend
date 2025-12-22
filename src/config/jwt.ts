import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiry: process.env.JWT_EXPIRY || '7d',
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET ||
    'your-super-secret-refresh-token-key-change-in-production',
  refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
};

