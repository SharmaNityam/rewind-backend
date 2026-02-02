import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if it's an AppError (includes validation errors)
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'Internal server error';

    // Log error
    logger.error('Request error', {
      error: {
        code,
        message,
        stack: err.stack,
        details: err.details,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
      },
    });

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && { details: err.details }),
      },
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
  });

  // Send generic error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

