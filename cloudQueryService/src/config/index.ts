import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dockerImage: process.env.DOCKER_IMAGE || 'query-runner:latest',
  queryNetwork: process.env.QUERY_NETWORK || 'query-network',
  logLevel: process.env.LOG_LEVEL || 'info',
} as const; 