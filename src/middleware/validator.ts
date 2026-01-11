import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => {
          return err.type === 'field'
            ? `${err.path}: ${err.msg}`
            : err.msg;
        });

        const validationError = new AppError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          errorMessages
        );
        return next(validationError); // Pass error to Express error handler
      }

      next();
    } catch (error) {
      // Catch any unexpected errors during validation
      next(error);
    }
  };
};

