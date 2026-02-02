import { AppDataSource } from '../config/typeorm';
import { DailyChallenge, UserChallengeCompletion, BreathingExercise, MeditationSession, User } from '../entities';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PawsService } from './paws.service';
import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { PenguinIntelligenceService } from './penguinIntelligence.service';
import { PenguinStateService } from './penguinState.service';

export interface BreathingExerciseData {
  durationSeconds: number;
}

export interface MeditationSessionData {
  durationSeconds: number;
  soundName: string;
}

export class CareCornerService {
  private static getChallengeRepository(): Repository<DailyChallenge> {
    return AppDataSource.getRepository(DailyChallenge);
  }

  private static getCompletionRepository(): Repository<UserChallengeCompletion> {
    return AppDataSource.getRepository(UserChallengeCompletion);
  }

  private static getBreathingRepository(): Repository<BreathingExercise> {
    return AppDataSource.getRepository(BreathingExercise);
  }

  private static getMeditationRepository(): Repository<MeditationSession> {
    return AppDataSource.getRepository(MeditationSession);
  }

  private static getUserRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  // Get daily challenges
  static async getDailyChallenges(date?: Date) {
    const challengeRepo = this.getChallengeRepository();
    const targetDate = date || new Date();
    const dateOnly = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    // Get challenge for the date
    let challenge = await challengeRepo.findOne({
      where: { challengeDate: dateOnly },
    });

    // If no challenge exists for today, create a default one
    if (!challenge) {
      challenge = challengeRepo.create({
        challengeText: 'Take a moment to practice gratitude today',
        challengeDate: dateOnly,
      });
      challenge = await challengeRepo.save(challenge);
    }

    return challenge;
  }

  // Complete challenge
  static async completeChallenge(userId: string, challengeId: string) {
    const challengeRepo = this.getChallengeRepository();
    const completionRepo = this.getCompletionRepository();

    // Check if challenge exists
    const challenge = await challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError('Challenge not found', 404, 'CHALLENGE_NOT_FOUND');
    }

    // Check if already completed
    const existing = await completionRepo.findOne({
      where: {
        userId,
        challengeId,
      },
    });

    if (existing) {
      throw new AppError('Challenge already completed', 400, 'CHALLENGE_ALREADY_COMPLETED');
    }

    // Mark as completed
    const completion = completionRepo.create({
      userId,
      challengeId,
    });
    await completionRepo.save(completion);

    logger.info(`Challenge completed: ${challengeId} by user: ${userId}`);

    return challenge;
  }

  // Start breathing exercise
  static async startBreathingExercise(userId: string, data: BreathingExerciseData) {
    const breathingRepo = this.getBreathingRepository();
    const userRepo = this.getUserRepository();

    const durationString = `${Math.floor(data.durationSeconds / 60)}:${String(data.durationSeconds % 60).padStart(2, '0')}`;
    const pawsEarned = PawsService.calculateBreathingPaws(data.durationSeconds);

    const exercise = breathingRepo.create({
      userId,
      durationSeconds: data.durationSeconds,
      durationString,
      pawsEarned,
    });

    const saved = await breathingRepo.save(exercise);

    // Update user paws balance
    const user = await userRepo.findOne({ where: { id: userId } });
    if (user) {
      user.pawsBalance += pawsEarned;
      await userRepo.save(user);
    }

    logger.info(`Breathing exercise completed: ${saved.id} by user: ${userId}`);

    // Integrate with Penguin Intelligence Service
    try {
      const penguinService = new PenguinIntelligenceService();
      const penguinState = await PenguinStateService.getOrCreateState(userId);
      const daysInactive = await PenguinStateService.calculateDaysInactive(userId);
      const timeOfDay = PenguinStateService.getTimeOfDay();

      const penguinResponse = await penguinService.infer({
        type: 'breathing',
        content: null,
        explicit_request: false,
        context: {
          time_of_day: timeOfDay,
          days_inactive: daysInactive,
          last_policy: null,
          state: {
            energy: penguinState.energy,
            mood: penguinState.mood,
            trust: penguinState.trust,
          },
        },
        user_id: userId,
      });

      // Apply state delta
      await PenguinStateService.applyDelta(userId, penguinResponse.penguin_state_delta);

      logger.info(`Penguin response generated for breathing exercise: ${saved.id}`);
    } catch (error) {
      logger.error('Failed to get penguin response for breathing exercise', {
        exerciseId: saved.id,
        error,
      });
    }

    return saved;
  }

  // Start meditation session
  static async startMeditationSession(userId: string, data: MeditationSessionData) {
    const meditationRepo = this.getMeditationRepository();
    const userRepo = this.getUserRepository();

    const durationString = `${Math.floor(data.durationSeconds / 60)}:${String(data.durationSeconds % 60).padStart(2, '0')}`;
    const pawsEarned = PawsService.calculateMeditationPaws(data.durationSeconds);

    const session = meditationRepo.create({
      userId,
      durationSeconds: data.durationSeconds,
      durationString,
      soundName: data.soundName,
      pawsEarned,
    });

    const saved = await meditationRepo.save(session);

    // Update user paws balance
    const user = await userRepo.findOne({ where: { id: userId } });
    if (user) {
      user.pawsBalance += pawsEarned;
      await userRepo.save(user);
    }

    logger.info(`Meditation session completed: ${saved.id} by user: ${userId}`);

    // Integrate with Penguin Intelligence Service (similar to breathing)
    try {
      const penguinService = new PenguinIntelligenceService();
      const penguinState = await PenguinStateService.getOrCreateState(userId);
      const daysInactive = await PenguinStateService.calculateDaysInactive(userId);
      const timeOfDay = PenguinStateService.getTimeOfDay();

      const penguinResponse = await penguinService.infer({
        type: 'breathing', // Meditation is similar to breathing for penguin
        content: null,
        explicit_request: false,
        context: {
          time_of_day: timeOfDay,
          days_inactive: daysInactive,
          last_policy: null,
          state: {
            energy: penguinState.energy,
            mood: penguinState.mood,
            trust: penguinState.trust,
          },
        },
        user_id: userId,
      });

      // Apply state delta
      await PenguinStateService.applyDelta(userId, penguinResponse.penguin_state_delta);

      logger.info(`Penguin response generated for meditation session: ${saved.id}`);
    } catch (error) {
      logger.error('Failed to get penguin response for meditation session', {
        sessionId: saved.id,
        error,
      });
    }

    return saved;
  }

  // Record breathing exercise (alias for startBreathingExercise)
  static async recordBreathing(userId: string, data: BreathingExerciseData) {
    return this.startBreathingExercise(userId, data);
  }

  // Record meditation session (alias for startMeditationSession)
  static async recordMeditation(userId: string, data: MeditationSessionData) {
    return this.startMeditationSession(userId, data);
  }

  // Get breathing history
  static async getBreathingHistory(userId: string, limit?: number) {
    const breathingRepo = this.getBreathingRepository();
    const exercises = await breathingRepo.find({
      where: { userId },
      take: limit,
      order: { completedAt: 'DESC' },
    });
    return exercises;
  }

  // Get meditation history
  static async getMeditationHistory(userId: string, limit?: number) {
    const meditationRepo = this.getMeditationRepository();
    const sessions = await meditationRepo.find({
      where: { userId },
      take: limit,
      order: { completedAt: 'DESC' },
    });
    return sessions;
  }

  // Get all activities
  static async getAllActivities(userId: string, limit?: number) {
    const breathingRepo = this.getBreathingRepository();
    const meditationRepo = this.getMeditationRepository();
    const completionRepo = this.getCompletionRepository();

    const [breathingExercises, meditationSessions, challengeCompletions] = await Promise.all([
      breathingRepo.find({
        where: { userId },
        take: limit,
        order: { completedAt: 'DESC' },
      }),
      meditationRepo.find({
        where: { userId },
        take: limit,
        order: { completedAt: 'DESC' },
      }),
      completionRepo.find({
        where: { userId },
        take: limit,
        order: { completedAt: 'DESC' },
        relations: ['challenge'],
      }),
    ]);

    return {
      breathingExercises,
      meditationSessions,
      challengeCompletions,
    };
  }

  // Get wellness stats
  static async getWellnessStats(userId: string) {
    const breathingRepo = this.getBreathingRepository();
    const meditationRepo = this.getMeditationRepository();
    const completionRepo = this.getCompletionRepository();
    const userRepo = this.getUserRepository();

    const [breathingCount, meditationCount, completionCount, user] = await Promise.all([
      breathingRepo.count({ where: { userId } }),
      meditationRepo.count({ where: { userId } }),
      completionRepo.count({ where: { userId } }),
      userRepo.findOne({ where: { id: userId } }),
    ]);

    return {
      totalBreathingExercises: breathingCount,
      totalMeditationSessions: meditationCount,
      totalChallengesCompleted: completionCount,
      pawsBalance: user?.pawsBalance || 0,
    };
  }

  // Get activity history
  static async getActivityHistory(userId: string, page: number = 1, perPage: number = 20) {
    const breathingRepo = this.getBreathingRepository();
    const meditationRepo = this.getMeditationRepository();
    const completionRepo = this.getCompletionRepository();
    const userRepo = this.getUserRepository();

    const skip = (page - 1) * perPage;

    const [breathingExercises, meditationSessions, challengeCompletions, user] = await Promise.all([
      breathingRepo.find({
        where: { userId },
        skip,
        take: perPage,
        order: { completedAt: 'DESC' },
      }),
      meditationRepo.find({
        where: { userId },
        skip,
        take: perPage,
        order: { completedAt: 'DESC' },
      }),
      completionRepo.find({
        where: { userId },
        skip,
        take: perPage,
        order: { completedAt: 'DESC' },
        relations: ['challenge'],
      }),
      userRepo.findOne({ where: { id: userId } }),
    ]);

    const [breathingCount, meditationCount, completionCount] = await Promise.all([
      breathingRepo.count({ where: { userId } }),
      meditationRepo.count({ where: { userId } }),
      completionRepo.count({ where: { userId } }),
    ]);

    return {
      breathingExercises,
      meditationSessions,
      challengeCompletions,
      stats: {
        totalBreathingExercises: breathingCount,
        totalMeditationSessions: meditationCount,
        totalChallengesCompleted: completionCount,
        pawsBalance: user?.pawsBalance || 0,
      },
      pagination: {
        page,
        perPage,
        total: breathingCount + meditationCount + completionCount,
        totalPages: Math.ceil((breathingCount + meditationCount + completionCount) / perPage),
        hasNext: page * perPage < breathingCount + meditationCount + completionCount,
        hasPrev: page > 1,
      },
    };
  }
}
