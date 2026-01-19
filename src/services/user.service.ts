import { AppDataSource } from '../config/typeorm';
import { User } from '../entities';
import { Gender } from '../entities/enums';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

export interface UpdateProfileData {
  name?: string;
  location?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  age?: number;
  healthGoal?: string;
  seekingProfessionalHelp?: boolean;
}

export interface OnboardingData {
  healthGoal: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  age: number;
  seekingProfessionalHelp: boolean;
}

export class UserService {
  private static getUserRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  // Get user profile
  static async getProfile(userId: string) {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Return without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user profile
  static async updateProfile(userId: string, data: UpdateProfileData) {
    const userRepo = this.getUserRepository();

    // Validate age if provided
    if (data.age !== undefined) {
      if (data.age < 14 || data.age > 99) {
        throw new AppError('Age must be between 14 and 99', 400, 'VALIDATION_ERROR');
      }
    }

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Update fields
    Object.assign(user, {
      name: data.name ?? user.name,
      location: data.location ?? user.location,
      dateOfBirth: data.dateOfBirth ?? user.dateOfBirth,
      gender: data.gender ?? user.gender,
      age: data.age ?? user.age,
      healthGoal: data.healthGoal ?? user.healthGoal,
      seekingProfessionalHelp: data.seekingProfessionalHelp ?? user.seekingProfessionalHelp,
    });

    const updated = await userRepo.save(user);
    logger.info(`Profile updated for user: ${userId}`);

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  // Update profile image
  static async updateProfileImage(userId: string, imageUrl: string) {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.profileImageUrl = imageUrl;
    const updated = await userRepo.save(user);

    logger.info(`Profile image updated for user: ${userId}`);

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  // Save onboarding data
  static async saveOnboarding(userId: string, data: OnboardingData) {
    const userRepo = this.getUserRepository();

    // Validate age
    if (data.age < 14 || data.age > 99) {
      throw new AppError('Age must be between 14 and 99', 400, 'VALIDATION_ERROR');
    }

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.healthGoal = data.healthGoal;
    user.gender = data.gender as Gender;
    user.age = data.age;
    user.seekingProfessionalHelp = data.seekingProfessionalHelp;
    user.onboardingCompleted = true;

    const updated = await userRepo.save(user);
    logger.info(`Onboarding completed for user: ${userId}`);

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  // Get onboarding status
  static async getOnboardingStatus(userId: string) {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      onboardingCompleted: user.onboardingCompleted,
      data: user.onboardingCompleted
        ? {
          healthGoal: user.healthGoal,
          gender: user.gender,
          age: user.age,
          seekingProfessionalHelp: user.seekingProfessionalHelp,
        }
        : null,
    };
  }
}
