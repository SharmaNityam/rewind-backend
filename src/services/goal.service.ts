import { AppDataSource } from '../config/typeorm';
import { Goal, GoalStatus } from '../entities';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

export interface CreateGoalData {
  title: string;
  description?: string;
  category?: string;
  targetDate?: Date;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  progress?: number;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  targetDate?: Date;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  progress?: number;
}

export class GoalService {
  private static getGoalRepository(): Repository<Goal> {
    return AppDataSource.getRepository(Goal);
  }

  // List user goals
  static async listGoals(userId: string, status?: string) {
    const goalRepo = this.getGoalRepository();
    const where: any = { userId };

    if (status) {
      where.status = status as GoalStatus;
    }

    const goals = await goalRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return goals;
  }

  // Get goal by ID
  static async getGoalById(goalId: string, userId: string) {
    const goalRepo = this.getGoalRepository();
    const goal = await goalRepo.findOne({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    return goal;
  }

  // Create goal
  static async createGoal(userId: string, data: CreateGoalData) {
    const goalRepo = this.getGoalRepository();

    // Validate progress
    if (data.progress !== undefined) {
      if (data.progress < 0 || data.progress > 100) {
        throw new AppError('Progress must be between 0 and 100', 400, 'VALIDATION_ERROR');
      }
    }

    const goal = goalRepo.create({
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      targetDate: data.targetDate,
      status: (data.status as GoalStatus) || GoalStatus.ACTIVE,
      progress: data.progress,
    });

    const saved = await goalRepo.save(goal);
    logger.info(`Goal created: ${saved.id} by user: ${userId}`);

    return saved;
  }

  // Update goal
  static async updateGoal(goalId: string, userId: string, data: UpdateGoalData) {
    const goalRepo = this.getGoalRepository();

    // Verify ownership
    const existing = await goalRepo.findOne({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    // Validate progress if provided
    if (data.progress !== undefined) {
      if (data.progress < 0 || data.progress > 100) {
        throw new AppError('Progress must be between 0 and 100', 400, 'VALIDATION_ERROR');
      }
    }

    Object.assign(existing, {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      category: data.category ?? existing.category,
      targetDate: data.targetDate ?? existing.targetDate,
      status: data.status ? (data.status as GoalStatus) : existing.status,
      progress: data.progress ?? existing.progress,
    });

    const updated = await goalRepo.save(existing);
    logger.info(`Goal updated: ${goalId} by user: ${userId}`);

    return updated;
  }

  // Delete goal
  static async deleteGoal(goalId: string, userId: string) {
    const goalRepo = this.getGoalRepository();

    // Verify ownership
    const existing = await goalRepo.findOne({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    await goalRepo.remove(existing);
    logger.info(`Goal deleted: ${goalId} by user: ${userId}`);
  }

  // Update goal progress
  static async updateProgress(
    goalId: string,
    userId: string,
    progress: number
  ) {
    const goalRepo = this.getGoalRepository();

    // Validate progress
    if (progress < 0 || progress > 100) {
      throw new AppError('Progress must be between 0 and 100', 400, 'VALIDATION_ERROR');
    }

    // Verify ownership
    const existing = await goalRepo.findOne({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    existing.progress = progress;

    // Auto-complete if progress is 100
    if (progress === 100) {
      existing.status = GoalStatus.COMPLETED;
      await goalRepo.save(existing);
    } else {
      await goalRepo.save(existing);
    }

    logger.info(`Goal progress updated: ${goalId} to ${progress}%`);

    return existing;
  }
}
