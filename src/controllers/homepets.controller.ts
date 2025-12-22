import { Response, NextFunction } from 'express';
import { HomePetsService } from '../services/homepets.service';
import { AuthRequest } from '../middleware/auth';

export class HomePetsController {
  // Get user's pet
  static async getUserPet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const pet = await HomePetsService.getUserPet(userId);

      res.status(200).json({
        success: true,
        data: pet,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update pet
  static async updateUserPet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { name, type, level, experience, customizations } = req.body;

      const pet = await HomePetsService.updateUserPet(userId, {
        name,
        type,
        level,
        experience,
        customizations,
      });

      res.status(200).json({
        success: true,
        data: pet,
        message: 'Pet updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

