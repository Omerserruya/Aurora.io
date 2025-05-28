import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate users using JWT from cookies or headers
 */
export const authentification = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  
  // Check for token in cookies first (for browser clients)
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } 
  // Then check authorization header (for programmatic clients)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Auth failed: No credentials were given' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'default-secret-key') as any;
    
    // Add user ID to request params for route handlers
    req.params.userId = decoded.userId;
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ message: 'Auth failed: Invalid token' });
  }
};

/**
 * Middleware to verify internal service requests
 * This allows microservices to communicate with each other securely
 */
export const internalServiceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for internal service header
  const isInternalService = req.headers['x-internal-service'] === 'true';
  
  if (!isInternalService) {
    return res.status(401).json({ message: 'Unauthorized: Internal service only endpoint' });
  }
  
  next();
}; 