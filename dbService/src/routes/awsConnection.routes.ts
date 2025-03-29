import { Router, Request, Response } from 'express';
import AWSConnectionController from '../controllers/awsConnection.controller';
import { authentification } from '@shared/authMiddleware';

const router = Router();
const awsConnectionController = AWSConnectionController.getInstance();

// Create a new AWS connection
router.post('/', authentification, (req: Request, res: Response) => {
  awsConnectionController.createConnection(req, res);
});

// Get all AWS connections for the current user
router.get('/', authentification, (req: Request, res: Response) => {
  awsConnectionController.getUserConnections(req, res);
});

// Get a specific AWS connection
router.get('/:id', authentification, (req: Request, res: Response) => {
  awsConnectionController.getConnection(req, res);
});

// Update an AWS connection
router.put('/:id', authentification, (req: Request, res: Response) => {
  awsConnectionController.updateConnection(req, res);
});

// Delete an AWS connection
router.delete('/:id', authentification, (req: Request, res: Response) => {
  awsConnectionController.deleteConnection(req, res);
});

// Validate an AWS connection
router.post('/:id/validate', authentification, (req: Request, res: Response) => {
  awsConnectionController.validateConnection(req, res);
});

// New endpoint for CloudQuery service to fetch encrypted credentials
router.get('/:id/cloudquery', (req: Request, res: Response) => {
  awsConnectionController.getEncryptedCredentials(req, res);
});

export default router; 