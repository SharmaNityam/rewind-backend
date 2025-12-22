import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AppDataSource } from '../config/typeorm';
import { User } from '../entities';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as {
        userId: string;
        email: string;
      };

      // Verify user still exists
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new AppError('User not found', 401, 'UNAUTHORIZED');
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as {
        userId: string;
        email: string;
      };

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: decoded.userId },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next();
  }
};
