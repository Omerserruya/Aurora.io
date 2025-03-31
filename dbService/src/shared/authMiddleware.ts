import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface Payload {
  userId: string;
}

// Authentification middleware - check if token is valid
export const authentification = (req: Request, res: Response, next: NextFunction): void => {
  console.log('[Auth] Checking authentication...');
  
  // Try to get token from cookie first
  let token = req.cookies?.accessToken;
  
  // If no token in cookie, check Authorization header (Bearer token)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
      console.log('[Auth] Token found in Authorization header');
    }
  }
  
  console.log('[Auth] Token found:', token ? 'Yes' : 'No');

  if (!token) {
    console.log('[Auth] No token found in cookies or headers, authentication failed');
    res.status(401).json({ message: 'Auth failed: No credentials were given' });
    return;
  }

  try {
    console.log('[Auth] Verifying token with JWT_KEY');
    const payload = jwt.verify(token, process.env.JWT_KEY as string) as Payload;
    
    console.log('[Auth] Token verified successfully, userId:', payload.userId);
    req.params.userId = payload.userId;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err);
    res.status(401).json({ message: 'Auth failed: Invalid token' });
  }
};

export default authentification; 