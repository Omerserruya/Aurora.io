import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import AWSConnectionService from '../services/awsConnection.service';
import { CreateAWSConnectionDTO, UpdateAWSConnectionDTO } from '../schemas/awsConnection.schema';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

class AWSConnectionController {
  private static instance: AWSConnectionController;
  private awsConnectionService: AWSConnectionService;

  private constructor() {
    this.awsConnectionService = AWSConnectionService.getInstance();
  }

  public static getInstance(): AWSConnectionController {
    if (!AWSConnectionController.instance) {
      AWSConnectionController.instance = new AWSConnectionController();
    }
    return AWSConnectionController.instance;
  }

  private getUserId(req: AuthenticatedRequest): ObjectId {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return new ObjectId(req.user.id);
  }

  async createConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionData: CreateAWSConnectionDTO = {
        ...req.body,
        userId
      };

      const connection = await this.awsConnectionService.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      console.error('Error creating AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to create AWS connection' });
      }
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new ObjectId(req.params.id);
      
      const connection = await this.awsConnectionService.getConnection(connectionId, userId);
      if (!connection) {
        res.status(404).json({ error: 'AWS connection not found' });
      } else {
        res.json(connection);
      }
    } catch (error) {
      console.error('Error getting AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to get AWS connection' });
      }
    }
  }

  async getUserConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connections = await this.awsConnectionService.getUserConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Error getting user AWS connections:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to get user AWS connections' });
      }
    }
  }

  async updateConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new ObjectId(req.params.id);
      const updateData: UpdateAWSConnectionDTO = req.body;

      const connection = await this.awsConnectionService.updateConnection(connectionId, userId, updateData);
      if (!connection) {
        res.status(404).json({ error: 'AWS connection not found' });
      } else {
        res.json(connection);
      }
    } catch (error) {
      console.error('Error updating AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to update AWS connection' });
      }
    }
  }

  async deleteConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new ObjectId(req.params.id);

      const deleted = await this.awsConnectionService.deleteConnection(connectionId, userId);
      if (!deleted) {
        res.status(404).json({ error: 'AWS connection not found' });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      console.error('Error deleting AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to delete AWS connection' });
      }
    }
  }

  async validateConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new ObjectId(req.params.id);

      const isValid = await this.awsConnectionService.validateConnection(connectionId, userId);
      res.json({ isValid });
    } catch (error) {
      console.error('Error validating AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to validate AWS connection' });
      }
    }
  }
}

export default AWSConnectionController; 