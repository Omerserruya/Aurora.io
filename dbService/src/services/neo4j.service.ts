import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jService {
    private static driver: Driver | null = null;
    private static sessions: Map<string, Session> = new Map();

    static initialize() {
        const uri = process.env.NEO4J_URL || 'bolt://neo4j:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'aurora123';

        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }

    static getSession(): Session {
        if (!this.driver) {
            throw new Error('Neo4j driver not initialized');
        }
        
        // Create a new session for each request
        const session = this.driver.session();
        return session;
    }

    static async close() {
        // Close all sessions
        for (const session of this.sessions.values()) {
            await session.close();
        }
        this.sessions.clear();

        // Close the driver
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
        }
    }
}

export { Neo4jService }; 