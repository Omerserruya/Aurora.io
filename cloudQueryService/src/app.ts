import { createServer } from './server';
import { config } from './config';
import { logger } from './utils/logger';

const app = createServer();

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
}); 