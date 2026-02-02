import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Validates UUID format in route parameters
 * Should be used on routes with :id parameters that expect UUIDs
 */
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const value = req.params[paramName];

    if (value && !uuidRegex.test(value)) {
      throw new AppError(
        `Invalid ${paramName} format. Expected UUID.`,
        400,
        'VALIDATION_ERROR',
        [`${paramName}: Invalid UUID format`]
      );
    }

    next();
  };
};
