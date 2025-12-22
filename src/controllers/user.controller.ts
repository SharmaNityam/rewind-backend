import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  // Get user profile
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const user = await UserService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const {
        name,
        location,
        dateOfBirth,
        gender,
        age,
        healthGoal,
        seekingProfessionalHelp,
      } = req.body;

      const user = await UserService.updateProfile(userId, {
        name,
        location,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        age: age ? parseInt(age, 10) : undefined,
        healthGoal,
        seekingProfessionalHelp,
      });

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update profile image
  static async updateProfileImage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // File will be uploaded via multer middleware
      const file = req.file;
      if (!file) {
        throw new Error('No file uploaded');
      }

      // Get file URL from file storage service
      const { FileStorageService } = await import('../services/fileStorage.service');
      const imageUrl = await FileStorageService.getFileUrl(file.path);

      const user = await UserService.updateProfileImage(userId, imageUrl);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile image updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Save onboarding data
  static async saveOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { healthGoal, gender, age, seekingProfessionalHelp } = req.body;

      const user = await UserService.saveOnboarding(userId, {
        healthGoal,
        gender,
        age: parseInt(age, 10),
        seekingProfessionalHelp,
      });

      res.status(200).json({
        success: true,
        data: user,
        message: 'Onboarding data saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get onboarding status
  static async getOnboardingStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const status = await UserService.getOnboardingStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
}

