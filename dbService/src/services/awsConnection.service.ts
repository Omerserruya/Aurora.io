import { ObjectId, WithId } from 'mongodb';
import MongoDBManager from '../config/mongodb';
import EncryptionConfig from '../config/encryption';
import { AWSConnection, CreateAWSConnectionDTO, UpdateAWSConnectionDTO } from '../schemas/awsConnection.schema';

class AWSConnectionService {
  private static instance: AWSConnectionService;
  private collection = 'aws_connections';
  private encryption: EncryptionConfig;

  private constructor() {
    this.encryption = EncryptionConfig.getInstance();
  }

  public static getInstance(): AWSConnectionService {
    if (!AWSConnectionService.instance) {
      AWSConnectionService.instance = new AWSConnectionService();
    }
    return AWSConnectionService.instance;
  }

  private encryptCredentials(credentials: AWSConnection['credentials']): AWSConnection['credentials'] {
    return {
      accessKeyId: this.encryption.encrypt(credentials.accessKeyId),
      secretAccessKey: this.encryption.encrypt(credentials.secretAccessKey),
      region: credentials.region,
      sessionToken: credentials.sessionToken ? this.encryption.encrypt(credentials.sessionToken) : undefined
    };
  }

  private decryptCredentials(credentials: AWSConnection['credentials']): AWSConnection['credentials'] {
    return {
      accessKeyId: this.encryption.decrypt(credentials.accessKeyId),
      secretAccessKey: this.encryption.decrypt(credentials.secretAccessKey),
      region: credentials.region,
      sessionToken: credentials.sessionToken ? this.encryption.decrypt(credentials.sessionToken) : undefined
    };
  }

  async createConnection(data: CreateAWSConnectionDTO): Promise<AWSConnection> {
    const db = MongoDBManager.getInstance().getDb();
    const now = new Date();
    
    const connection: AWSConnection = {
      ...data,
      provider: 'aws',
      credentials: this.encryptCredentials(data.credentials),
      isValidated: false,
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection(this.collection).insertOne(connection);
    return { ...connection, _id: result.insertedId };
  }

  async getConnection(id: ObjectId, userId: ObjectId): Promise<AWSConnection | null> {
    const db = MongoDBManager.getInstance().getDb();
    const connection = await db.collection<AWSConnection>(this.collection).findOne({ _id: id, userId });
    
    if (!connection) return null;
    
    return {
      ...connection,
      credentials: this.decryptCredentials(connection.credentials)
    };
  }

  async getUserConnections(userId: ObjectId): Promise<AWSConnection[]> {
    const db = MongoDBManager.getInstance().getDb();
    const connections = await db.collection<AWSConnection>(this.collection).find({ userId }).toArray();
    
    return connections.map(connection => ({
      ...connection,
      credentials: this.decryptCredentials(connection.credentials)
    }));
  }

  async updateConnection(id: ObjectId, userId: ObjectId, data: UpdateAWSConnectionDTO): Promise<AWSConnection | null> {
    const db = MongoDBManager.getInstance().getDb();
    
    // Create a type-safe update object
    const updateData: Partial<AWSConnection> = {
      updatedAt: new Date()
    };

    // Add optional fields if they exist
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.accounts) updateData.accounts = data.accounts;
    if (data.isValidated !== undefined) updateData.isValidated = data.isValidated;

    // Handle credentials separately to ensure type safety
    if (data.credentials) {
      const { accessKeyId, secretAccessKey, region, sessionToken } = data.credentials;
      if (accessKeyId && secretAccessKey && region) {
        updateData.credentials = this.encryptCredentials({
          accessKeyId,
          secretAccessKey,
          region,
          sessionToken
        });
      }
    }

    const result = await db.collection<AWSConnection>(this.collection).findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) return null;

    return {
      ...result,
      credentials: this.decryptCredentials(result.credentials)
    };
  }

  async deleteConnection(id: ObjectId, userId: ObjectId): Promise<boolean> {
    const db = MongoDBManager.getInstance().getDb();
    const result = await db.collection(this.collection).deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  async validateConnection(id: ObjectId, userId: ObjectId): Promise<boolean> {
    // For now, as per requirements, always return true
    // This will be replaced with actual AWS validation later
    const db = MongoDBManager.getInstance().getDb();
    await db.collection(this.collection).updateOne(
      { _id: id, userId },
      { $set: { isValidated: true, updatedAt: new Date() } }
    );
    return true;
  }
}

export default AWSConnectionService; 