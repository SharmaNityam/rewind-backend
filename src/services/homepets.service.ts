// HomePets service - integrated with Penguin Intelligence Service
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PenguinStateService } from './penguinState.service';
import { PenguinIntelligenceService } from './penguinIntelligence.service';

export interface PetData {
  name?: string;
  type?: string;
  level?: number;
  experience?: number;
  customizations?: Record<string, unknown>;
}

export class HomePetsService {
  // Get user's pet information (now returns real penguin state)
  static async getUserPet(userId: string) {
    const penguinState = await PenguinStateService.getOrCreateState(userId);
    const penguinMemory = await PenguinStateService.getOrCreateMemory(userId);
    
    // Get memory from Penguin service (optional)
    const penguinService = new PenguinIntelligenceService();
    const memory = await penguinService.getMemory(userId);

    // Calculate level based on total state (energy + mood + trust)
    const totalState = penguinState.energy + penguinState.mood + penguinState.trust;
    const level = Math.floor(totalState / 30); // Level 1-10 based on state (0-300)
    const experience = totalState; // Experience = total state value

    return {
      id: userId,
      name: 'Penguin Companion',
      type: 'penguin',
      level: Math.max(1, level),
      experience,
      state: {
        energy: penguinState.energy,
        mood: penguinState.mood,
        trust: penguinState.trust,
      },
      memory: memory || {
        weekAvgMood: penguinMemory.weekAvgMood,
        dominantEmotion: penguinMemory.dominantEmotion,
        talkPreference: penguinMemory.talkPreference,
      },
      customizations: {},
    };
  }

  // Update pet information
  static async updateUserPet(userId: string, data: PetData) {
    // For now, just log the update
    // In the future, this would update a pets table
    logger.info(`Pet updated for user: ${userId}`, data);

    return {
      id: 'placeholder',
      ...data,
    };
  }
}

