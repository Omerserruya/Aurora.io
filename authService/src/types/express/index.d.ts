import { IUser } from '../../models/user_model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
} 