import { Router, Request, Response, RequestHandler } from 'express';
import AWSConnectionController from '../controllers/awsConnection.controller';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

const router = Router();
const awsConnectionController = AWSConnectionController.getInstance();

// Helper function to wrap authenticated handlers
const authenticatedHandler = (handler: (req: AuthenticatedRequest, res: Response) => Promise<void>): RequestHandler => {
  return async (req: Request, res: Response) => {
    await handler(req as AuthenticatedRequest, res);
  };
};

// Create a new AWS connection
router.post('/', authenticatedHandler(awsConnectionController.createConnection));

// Get all AWS connections for the current user
router.get('/', authenticatedHandler(awsConnectionController.getUserConnections));

// Get a specific AWS connection
router.get('/:id', authenticatedHandler(awsConnectionController.getConnection));

// Update an AWS connection
router.put('/:id', authenticatedHandler(awsConnectionController.updateConnection));

// Delete an AWS connection
router.delete('/:id', authenticatedHandler(awsConnectionController.deleteConnection));

// Validate an AWS connection
router.post('/:id/validate', authenticatedHandler(awsConnectionController.validateConnection));

export default router; 