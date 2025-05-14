import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface Payload {
  userId: string;
}

// Authentification middleware - check if token is valid
export const authentification = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.accessToken as string;

  if (!token) {
    res.status(401).json({ message: 'Auth failed: No credentials were given' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err, payload) => {
    if (err || !payload) {
      res.status(401).json({ message: 'Auth failed' });
      return;
    }

    req.params.userId = (payload as Payload).userId;
    next();
  });
};

export default authentification;
