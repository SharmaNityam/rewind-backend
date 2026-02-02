import { AppDataSource } from '../config/typeorm';
import { UserPenguinState } from '../entities/UserPenguinState.entity';
import { UserPenguinMemory } from '../entities/UserPenguinMemory.entity';
import { Journal } from '../entities/Journal.entity';
import { Repository, LessThan } from 'typeorm';
import { logger } from '../utils/logger';

export interface PenguinState {
  energy: number;
  mood: number;
  trust: number;
}

export class PenguinStateService {
  private static getStateRepository(): Repository<UserPenguinState> {
    return AppDataSource.getRepository(UserPenguinState);
  }

  private static getMemoryRepository(): Repository<UserPenguinMemory> {
    return AppDataSource.getRepository(UserPenguinMemory);
  }

  private static getJournalRepository(): Repository<Journal> {
    return AppDataSource.getRepository(Journal);
  }

  /**
   * Get or create penguin state for user
   */
  static async getOrCreateState(userId: string): Promise<UserPenguinState> {
    const repo = this.getStateRepository();
    let state = await repo.findOne({ where: { userId } });

    if (!state) {
      state = repo.create({
        userId,
        energy: 50,
        mood: 50,
        trust: 50,
      });
      state = await repo.save(state);
      logger.info(`Created penguin state for user: ${userId}`);
    }

    return state;
  }

  /**
   * Get current penguin state
   */
  static async getState(userId: string): Promise<PenguinState | null> {
    const state = await this.getStateRepository().findOne({ where: { userId } });
    if (!state) return null;

    return {
      energy: state.energy,
      mood: state.mood,
      trust: state.trust,
    };
  }

  /**
   * Apply state delta with clipping to [0-100] range
   */
  static async applyDelta(
    userId: string,
    delta: { energy: number; mood: number; trust: number },
    smoothingAlpha: number = 0.3
  ): Promise<UserPenguinState> {
    const state = await this.getOrCreateState(userId);

    // Apply exponential moving average smoothing
    const smoothedDelta = {
      energy: delta.energy * smoothingAlpha,
      mood: delta.mood * smoothingAlpha,
      trust: delta.trust * smoothingAlpha,
    };

    // Apply delta with clipping
    state.energy = Math.max(0, Math.min(100, state.energy + smoothedDelta.energy));
    state.mood = Math.max(0, Math.min(100, state.mood + smoothedDelta.mood));
    state.trust = Math.max(0, Math.min(100, state.trust + smoothedDelta.trust));

    const updated = await this.getStateRepository().save(state);
    logger.debug(`Penguin state updated for user: ${userId}`, {
      energy: updated.energy,
      mood: updated.mood,
      trust: updated.trust,
    });

    return updated;
  }

  /**
   * Calculate days since last journal entry
   */
  static async calculateDaysInactive(userId: string): Promise<number> {
    const journalRepo = this.getJournalRepository();
    
    const lastJournal = await journalRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!lastJournal) {
      // No journals yet - consider as inactive from account creation
      return 0; // Or calculate from user creation date
    }

    const daysDiff = Math.floor(
      (Date.now() - lastJournal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDiff;
  }

  /**
   * Get time of day based on current time
   */
  static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Get or create penguin memory
   */
  static async getOrCreateMemory(userId: string): Promise<UserPenguinMemory> {
    const repo = this.getMemoryRepository();
    let memory = await repo.findOne({ where: { userId } });

    if (!memory) {
      memory = repo.create({
        userId,
        weekAvgMood: null,
        dominantEmotion: null,
        talkPreference: null,
      });
      memory = await repo.save(memory);
    }

    return memory;
  }

  /**
   * Update penguin memory
   */
  static async updateMemory(
    userId: string,
    updates: {
      weekAvgMood?: number;
      dominantEmotion?: string;
      talkPreference?: string;
    }
  ): Promise<UserPenguinMemory> {
    const memory = await this.getOrCreateMemory(userId);

    if (updates.weekAvgMood !== undefined) {
      memory.weekAvgMood = updates.weekAvgMood;
    }
    if (updates.dominantEmotion !== undefined) {
      memory.dominantEmotion = updates.dominantEmotion;
    }
    if (updates.talkPreference !== undefined) {
      memory.talkPreference = updates.talkPreference;
    }

    return await this.getMemoryRepository().save(memory);
  }
}
