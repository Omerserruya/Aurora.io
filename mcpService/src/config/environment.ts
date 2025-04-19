import dotenv from 'dotenv';
import path from 'path';

// Use environment-specific .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Also load the root .env file for shared variables like GEMINI_API_KEY
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const environment = {
  port: process.env.PORT || 4006,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  dbServiceUrl: process.env.DB_SERVICE_URL || 'http://db-service:4003',
  logLevel: process.env.LOG_LEVEL || 'info',
  defaultModelProvider: 'gemini'
}; 