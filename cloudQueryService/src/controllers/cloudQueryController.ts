import { Request, Response } from 'express';
import { DockerService } from '../services/dockerService';
import { logger } from '../utils/logger';

export class CloudQueryController {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { userID, awsCredentials } = req.body;

      if (!userID || !awsCredentials) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      const containerId = await this.dockerService.runContainer({
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
      const { userID } = req.body;

      if (!userID) {
        res.status(400).json({ error: 'Missing userID' });
        return;
      }

      const containerId = await this.dockerService.runContainer({
        userID
      });

      res.json({ message: 'Query started', containerId });
    } catch (error) {
      logger.error('Query error:', error);
      res.status(500).json({ error: 'Query failed' });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const runningContainers = this.dockerService.getRunningContainersCount();
      res.json({ runningContainers });
    } catch (error) {
      logger.error('Status check error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
} 