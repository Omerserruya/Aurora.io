import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to verify internal service requests
 * Since port is not exposed, this provides additional validation for Docker network access
 */
export const internalServiceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for internal service header
  const isInternalService = req.headers['x-internal-service'] === 'true';
  
  if (!isInternalService) {
    console.log('Rejected non-internal service request');
    return res.status(401).json({ message: 'Unauthorized: Internal service only endpoint' });
  }
  
  console.log('Internal service request validated');
  next();
}; 