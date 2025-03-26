
import neo4j, { Driver } from 'neo4j-driver';

class Neo4jManager {
  private static instance: Neo4jManager;
  private driver: Driver | null = null;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): Neo4jManager {
    if (!Neo4jManager.instance) {
      Neo4jManager.instance = new Neo4jManager();
    }
    return Neo4jManager.instance;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      const neo4jUrl = process.env.NEO4J_URL;
      const neo4jUser = process.env.NEO4J_USER;
      const neo4jPassword = process.env.NEO4J_PASSWORD;

      if (!neo4jUrl || !neo4jUser || !neo4jPassword) {
        throw new Error('Neo4j configuration is incomplete in environment variables');
      }
      this.initialized = true;
    }
  }

  public async connect(): Promise<void> {
    if (this.driver) {
      return;
    }

    try {
      this.ensureInitialized();
      const neo4jUrl = process.env.NEO4J_URL!; // We know it exists because of ensureInitialized
      const neo4jUser = process.env.NEO4J_USER!;
      const neo4jPassword = process.env.NEO4J_PASSWORD!;

      this.driver = neo4j.driver(neo4jUrl, neo4j.auth.basic(neo4jUser, neo4jPassword));
      await this.driver.verifyConnectivity();
      console.log('Connected to Neo4j successfully');
    } catch (error) {
      console.error('Neo4j connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      console.log('Disconnected from Neo4j');
    }
  }

  public getDriver(): Driver {
    if (!this.driver) {
      throw new Error('Neo4j connection not established');
    }
    return this.driver;
  }
}

export default Neo4jManager; 