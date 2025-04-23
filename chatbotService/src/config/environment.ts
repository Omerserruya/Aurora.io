import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`Loaded environment variables from ${envFile}`);

export const environment = {
  port: process.env.PORT || 4005,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbServiceUrl: process.env.DB_SERVICE_URL || 'http://db-service:4003',
  mcpServiceUrl: process.env.MCP_SERVICE_URL || 'http://mcp-service:4006'
}; 