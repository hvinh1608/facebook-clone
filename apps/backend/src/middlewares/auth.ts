import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from 'database';
import { JWT_ACCESS_SECRET } from '../config/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
  file?: any;
  files?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Get token from Authorization header
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }

    // 2. Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (err) {
      return next(new UnauthorizedError('Invalid access token or token has expired.'));
    }

    // 3. Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    if (user.status === 'BLOCKED') {
      return next(new ForbiddenError('Your account has been blocked by administrators.'));
    }

    // 4. Grant access
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: ('USER' | 'ADMIN')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }
    next();
  };
};
