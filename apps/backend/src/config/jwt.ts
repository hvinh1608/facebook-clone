import dotenv from 'dotenv';
dotenv.config();

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'supersecretaccesskey';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey';

export const JWT_ACCESS_EXPIRES_IN = '15m'; // Access token lasts 15 minutes
export const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token lasts 7 days
