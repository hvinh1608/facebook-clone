import { Role } from 'database';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}
