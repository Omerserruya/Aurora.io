
import mongoose from 'mongoose';

class MongoDBManager {
  private static instance: MongoDBManager;
  private connection: mongoose.Connection | null = null;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBManager {
    if (!MongoDBManager.instance) {
      MongoDBManager.instance = new MongoDBManager();
    }
    return MongoDBManager.instance;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      const mongoUrl = process.env.MONGODB_URL;
      if (!mongoUrl) {
        throw new Error('MONGODB_URL is not defined in environment variables');
      }
      this.initialized = true;
    }
  }

  public async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      this.ensureInitialized();
      const mongoUrl = process.env.MONGODB_URL!; // We know it exists because of ensureInitialized

      await mongoose.connect(mongoUrl);
      this.connection = mongoose.connection;
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.log('Disconnected from MongoDB');
    }
  }

  public getConnection(): mongoose.Connection {
    if (!this.connection) {
      throw new Error('MongoDB connection not established');
    }
    return this.connection;
  }
}

export default MongoDBManager; 