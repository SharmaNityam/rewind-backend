import { Response, NextFunction } from 'express';
import { GoalService } from '../services/goal.service';
import { AuthRequest } from '../middleware/auth';

export class GoalController {
  // List goals
  static async listGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { status } = req.query;

      const goals = await GoalService.listGoals(
        userId,
        status as string | undefined
      );

      res.status(200).json({
        success: true,
        data: goals,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get goal by ID
  static async getGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const goal = await GoalService.getGoalById(id, userId);

      res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create goal
  static async createGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const {
        title,
        description,
        category,
        targetDate,
        status,
        progress,
      } = req.body;

      const goal = await GoalService.createGoal(userId, {
        title,
        description,
        category,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        status,
        progress: progress ? parseInt(progress, 10) : undefined,
      });

      res.status(201).json({
        success: true,
        data: goal,
        message: 'Goal created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update goal
  static async updateGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const {
        title,
        description,
        category,
        targetDate,
        status,
        progress,
      } = req.body;

      const goal = await GoalService.updateGoal(id, userId, {
        title,
        description,
        category,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        status,
        progress: progress !== undefined ? parseInt(progress, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: goal,
        message: 'Goal updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete goal
  static async deleteGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await GoalService.deleteGoal(id, userId);

      res.status(200).json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update goal progress
  static async updateProgress(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { progress } = req.body;

      const goal = await GoalService.updateProgress(
        id,
        userId,
        parseInt(progress, 10)
      );

      res.status(200).json({
        success: true,
        data: goal,
        message: 'Goal progress updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

