import { Request, Response } from 'express';
import { Types } from 'mongoose';
import AWSConnectionModel, { IAWSConnection, CreateAWSConnectionDTO, UpdateAWSConnectionDTO } from '../models/awsConnection.model';
import EncryptionConfig from '../config/encryption';

class AWSConnectionController {
  private static instance: AWSConnectionController;
  private encryption: EncryptionConfig;

  private constructor() {
    this.encryption = EncryptionConfig.getInstance();
    
    // Bind methods to this instance to maintain the correct 'this' context
    this.createConnection = this.createConnection.bind(this);
    this.getConnection = this.getConnection.bind(this);
    this.getUserConnections = this.getUserConnections.bind(this);
    this.updateConnection = this.updateConnection.bind(this);
    this.deleteConnection = this.deleteConnection.bind(this);
    this.validateConnection = this.validateConnection.bind(this);
    this.getEncryptedCredentials = this.getEncryptedCredentials.bind(this);
  }

  public static getInstance(): AWSConnectionController {
    if (!AWSConnectionController.instance) {
      AWSConnectionController.instance = new AWSConnectionController();
    }
    return AWSConnectionController.instance;
  }

  private getUserId(req: Request): Types.ObjectId {
    if (!req.params.userId) {
      throw new Error('User not authenticated');
    }
    return new Types.ObjectId(req.params.userId);
  }

  private encryptCredentials(credentials: IAWSConnection['credentials']): IAWSConnection['credentials'] {
    return {
      accessKeyId: this.encryption.encrypt(credentials.accessKeyId),
      secretAccessKey: this.encryption.encrypt(credentials.secretAccessKey),
      region: credentials.region,
      sessionToken: credentials.sessionToken ? this.encryption.encrypt(credentials.sessionToken) : undefined
    };
  }

  private decryptCredentials(credentials: IAWSConnection['credentials']): IAWSConnection['credentials'] {
    return {
      accessKeyId: this.encryption.decrypt(credentials.accessKeyId),
      secretAccessKey: this.encryption.decrypt(credentials.secretAccessKey),
      region: credentials.region,
      sessionToken: credentials.sessionToken ? this.encryption.decrypt(credentials.sessionToken) : undefined
    };
  }

  async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionData: CreateAWSConnectionDTO = {
        ...req.body,
        userId,
        provider: 'aws',
        credentials: this.encryptCredentials(req.body.credentials),
        isValidated: true
      };

      const connection = new AWSConnectionModel(connectionData);
      await connection.save();

      res.status(201).json({
        ...connection.toObject(),
        credentials: this.decryptCredentials(connection.credentials)
      });
    } catch (error) {
      console.error('Error creating AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to create AWS connection' });
      }
    }
  }

  async getConnection(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new Types.ObjectId(req.params.id);
      
      const connection = await AWSConnectionModel.findOne({ _id: connectionId, userId });
      if (!connection) {
        res.status(404).json({ error: 'AWS connection not found' });
      } else {
        res.json({
          ...connection.toObject(),
          credentials: this.decryptCredentials(connection.credentials)
        });
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

  async getUserConnections(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connections = await AWSConnectionModel.find({ userId });
      
      res.json(connections.map((connection: IAWSConnection) => ({
        ...connection.toObject(),
        credentials: this.decryptCredentials(connection.credentials)
      })));
    } catch (error) {
      console.error('Error getting user AWS connections:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to get user AWS connections' });
      }
    }
  }

  async updateConnection(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new Types.ObjectId(req.params.id);
      const updateData: Partial<IAWSConnection> = {};

      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.accounts) updateData.accounts = req.body.accounts;
      if (req.body.isValidated !== undefined) updateData.isValidated = req.body.isValidated;

      if (req.body.credentials) {
        const { accessKeyId, secretAccessKey, region, sessionToken } = req.body.credentials;
        if (accessKeyId && secretAccessKey && region) {
          updateData.credentials = this.encryptCredentials({
            accessKeyId,
            secretAccessKey,
            region,
            sessionToken
          });
        }
      }

      const connection = await AWSConnectionModel.findOneAndUpdate(
        { _id: connectionId, userId },
        { $set: updateData },
        { new: true }
      );

      if (!connection) {
        res.status(404).json({ error: 'AWS connection not found' });
      } else {
        res.json({
          ...connection.toObject(),
          credentials: this.decryptCredentials(connection.credentials)
        });
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

  async deleteConnection(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new Types.ObjectId(req.params.id);

      const result = await AWSConnectionModel.deleteOne({ _id: connectionId, userId });
      if (result.deletedCount === 0) {
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

  async validateConnection(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const connectionId = new Types.ObjectId(req.params.id);

      // For now, as per requirements, always return true
      // This will be replaced with actual AWS validation later
      await AWSConnectionModel.updateOne(
        { _id: connectionId, userId },
        { $set: { isValidated: true } }
      );
      
      res.json({ isValid: true });
    } catch (error) {
      console.error('Error validating AWS connection:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(500).json({ error: 'Failed to validate AWS connection' });
      }
    }
  }

  async getEncryptedCredentials(req: Request, res: Response): Promise<void> {
    try {
      const connectionId = new Types.ObjectId(req.params.id);
      
      // Verify service-to-service authentication
      const serviceKey = req.headers['x-service-key'];
      if (serviceKey !== process.env.CLOUDQUERY_SERVICE_KEY) {
        res.status(401).json({ error: 'Unauthorized service access' });
        return;
      }

      const connection = await AWSConnectionModel.findOne({ _id: connectionId });
      if (!connection) {
        res.status(404).json({ error: 'AWS connection not found' });
      } else {
        // Return only the encrypted credentials
        res.json({
          credentials: connection.credentials,
          region: connection.credentials.region
        });
      }
    } catch (error) {
      console.error('Error getting encrypted credentials:', error);
      res.status(500).json({ error: 'Failed to get encrypted credentials' });
    }
  }
}

export default AWSConnectionController; 