import initApp from "./server";
import MongoDBManager from './config/mongodb';
import Neo4jManager from './config/neo4j';

const port = process.env.PORT || 4003;

initApp().then((app) => {
  app.listen(port, () => {
    console.log(`Database service running on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database connections...');
  const mongoManager = MongoDBManager.getInstance();
  const neo4jManager = Neo4jManager.getInstance();
  await Promise.all([
    mongoManager.disconnect(),
    neo4jManager.disconnect()
  ]);
  process.exit(0);
}); 