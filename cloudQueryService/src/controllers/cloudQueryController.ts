import { Request, Response } from 'express';
import { DockerService } from '../services/dockerService';
import { logger } from '../utils/logger';
import axios from 'axios';

interface EncryptedCredentials {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    sessionToken?: string;
  };
  region: string;
}

export class CloudQueryController {
  private dockerService: DockerService;
  private readonly dbServiceUrl: string;

  constructor() {
    this.dockerService = new DockerService();
    this.dbServiceUrl = process.env.DB_SERVICE_URL || 'http://db-service:4003';
  }

  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { awsCredentials } = req.body;
      const userID = req.params.userId;
      if (!userID || !awsCredentials) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      const containerId = await this.dockerService.runContainer(process.env.VALIDATE_IMAGE || "auroraiohub/validate-image:latest",{
        userID,
        ...awsCredentials
      });

      res.json({ message: 'Validation successful', containerId });
    } catch (error) {
      logger.error('Validation error:', error);
      res.status(500).json({ error: 'Validation failed' });
    }
  }

  async query(req: Request, res: Response): Promise<void> {
    try {
      const {connectionId } = req.body;
      const userID = req.params.userId;
      if (!userID || !connectionId) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Fetch encrypted credentials from database service
      const response = await axios.get<EncryptedCredentials>(`${this.dbServiceUrl}/aws-connections/${connectionId}/cloudquery`, {
        headers: {
          'x-service-key': process.env.SERVICE_KEY
        }
      });

      const { credentials } = response.data;

      // Prepare environment variables for container
      const containerEnv: Record<string, string> = {
        userID,
        AWS_ACCESS_KEY_ID: credentials.accessKeyId,
        AWS_SECRET_ACCESS_KEY: credentials.secretAccessKey,
        AWS_REGION: credentials.region,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '', // Pass encryption key to container
        DB_SERVICE_URL: `${this.dbServiceUrl}/neo`, // Add DB service URL
        CONNECTION_ID: connectionId // Add connection ID
      };

      // Only add session token if it exists
      if (credentials.sessionToken) {
        containerEnv.AWS_SESSION_TOKEN = credentials.sessionToken;
      }

      // Pass encrypted credentials to container
      const containerId = await this.dockerService.runContainer(
        process.env.QUERY_IMAGE || "query-runner:debug",
        containerEnv
      );

      res.json({ message: 'Query started', containerId });
    } catch (error) {
      logger.error('Query error:', error);
      res.status(500).json({ error: 'Query failed' });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const runningContainers = this.dockerService.getRunningContainers();
      const count = this.dockerService.getRunningContainersCount();
      
      res.json({
        runningContainers: count,
        containers: runningContainers
      });
    } catch (error) {
      logger.error('Status check error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
} 