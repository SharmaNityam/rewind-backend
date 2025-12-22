import { Response, NextFunction } from 'express';
import { CareCornerService } from '../services/careCorner.service';
import { AuthRequest } from '../middleware/auth';

export class CareCornerController {
  // Get daily challenges
  static async getChallenges(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;

      const challenge = await CareCornerService.getDailyChallenges(
        date ? new Date(date as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      next(error);
    }
  }

  // Complete challenge
  static async completeChallenge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const challenge = await CareCornerService.completeChallenge(userId, id);

      res.status(200).json({
        success: true,
        data: challenge,
        message: 'Challenge completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get breathing history
  static async getBreathingHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { limit } = req.query;

      const exercises = await CareCornerService.getBreathingHistory(
        userId,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: exercises,
      });
    } catch (error) {
      next(error);
    }
  }

  // Record breathing exercise
  static async recordBreathing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { durationSeconds } = req.body;

      const exercise = await CareCornerService.recordBreathing(userId, {
        durationSeconds: parseInt(durationSeconds, 10),
      });

      res.status(201).json({
        success: true,
        data: exercise,
        message: 'Breathing exercise recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get meditation history
  static async getMeditationHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { limit } = req.query;

      const sessions = await CareCornerService.getMeditationHistory(
        userId,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Record meditation session
  static async recordMeditation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { durationSeconds, soundName } = req.body;

      const session = await CareCornerService.recordMeditation(userId, {
        durationSeconds: parseInt(durationSeconds, 10),
        soundName,
      });

      res.status(201).json({
        success: true,
        data: session,
        message: 'Meditation session recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all activities
  static async getAllActivities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { limit } = req.query;

      const activities = await CareCornerService.getAllActivities(
        userId,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get wellness stats
  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const stats = await CareCornerService.getWellnessStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

