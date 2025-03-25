import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

class Neo4jManager {
  private static instance: Neo4jManager;
  private driver: Driver | null = null;

  private constructor() {}

  public static getInstance(): Neo4jManager {
    if (!Neo4jManager.instance) {
      Neo4jManager.instance = new Neo4jManager();
    }
    return Neo4jManager.instance;
  }

  public async connect(): Promise<void> {
    try {
      const uri = process.env.NEO4J_URI || 'bolt://neo4j:7687';
      const username = process.env.NEO4J_USERNAME || 'neo4j';
      const password = process.env.NEO4J_PASSWORD || 'aurora123';

      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      await this.driver.verifyConnectivity();
      console.log('Successfully connected to Neo4j');
    } catch (error) {
      console.error('Error connecting to Neo4j:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.driver) {
        await this.driver.close();
        this.driver = null;
        console.log('Successfully disconnected from Neo4j');
      }
    } catch (error) {
      console.error('Error disconnecting from Neo4j:', error);
      throw error;
    }
  }

  public getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not connected');
    }
    return this.driver.session();
  }
}

export default Neo4jManager; 