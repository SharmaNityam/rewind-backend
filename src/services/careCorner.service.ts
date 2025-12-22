import { AppDataSource } from '../config/typeorm';
import { DailyChallenge, UserChallengeCompletion, BreathingExercise, MeditationSession, User } from '../entities';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PawsService } from './paws.service';
import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';

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

    return saved;
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
