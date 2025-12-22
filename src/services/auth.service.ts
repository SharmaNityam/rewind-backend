import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/typeorm';
import { User, RefreshToken } from '../entities';
import { jwtConfig } from '../config/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map<
  string,
  { code: string; expiresAt: Date; verified: boolean }
>();

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // Get repositories
  private static getUserRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  private static getRefreshTokenRepository(): Repository<RefreshToken> {
    return AppDataSource.getRepository(RefreshToken);
  }

  // Generate OTP
  static generateOTP(length: number = 6): string {
    return Math.floor(
      Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
    ).toString();
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  static generateTokens(userId: string, email: string): TokenPair {
    const accessToken = jwt.sign(
      { userId, email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiry }
    );

    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiry }
    );

    return { accessToken, refreshToken };
  }

  // Register user
  static async register(data: RegisterData): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const { name, email, phone, password } = data;
    const userRepo = this.getUserRepository();
    const refreshTokenRepo = this.getRefreshTokenRepository();

    if (!email && !phone) {
      throw new AppError('Email or phone is required', 400, 'VALIDATION_ERROR');
    }

    // Check if user already exists
    if (email) {
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
      }
    }

    if (phone) {
      const existingUser = await userRepo.findOne({ where: { phone } });
      if (existingUser) {
        throw new AppError('Phone already registered', 409, 'PHONE_EXISTS');
      }
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = userRepo.create({
      name,
      email: email || null,
      phone: phone || null,
      passwordHash,
    });

    const savedUser = await userRepo.save(user);

    // Generate tokens
    const tokens = this.generateTokens(savedUser.id, savedUser.email || '');

    // Store refresh token
    const refreshToken = refreshTokenRepo.create({
      userId: savedUser.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    await refreshTokenRepo.save(refreshToken);

    logger.info(`User registered: ${savedUser.id}`);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return { user: userWithoutPassword, tokens };
  }

  // Login user
  static async login(data: LoginData): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const { email, phone, password } = data;
    const userRepo = this.getUserRepository();
    const refreshTokenRepo = this.getRefreshTokenRepository();

    if (!email && !phone) {
      throw new AppError('Email or phone is required', 400, 'VALIDATION_ERROR');
    }

    // Find user
    const user = await userRepo.findOne({
      where: email ? { email } : { phone: phone! },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email || '');

    // Store refresh token
    const refreshToken = refreshTokenRepo.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    await refreshTokenRepo.save(refreshToken);

    logger.info(`User logged in: ${user.id}`);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  // Forgot password - generate OTP
  static async forgotPassword(emailOrPhone: string): Promise<void> {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({
      where: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      // Don't reveal if user exists for security
      return;
    }

    const otp = this.generateOTP(6);
    const expiresAt = new Date(
      Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) * 60 * 1000
    );

    otpStore.set(emailOrPhone, { code: otp, expiresAt, verified: false });

    // In production, send OTP via email/SMS
    logger.info(`OTP for ${emailOrPhone}: ${otp}`);

    // TODO: Integrate with email/SMS service
  }

  // Verify OTP
  static async verifyOTP(emailOrPhone: string, otp: string): Promise<boolean> {
    const stored = otpStore.get(emailOrPhone);

    if (!stored) {
      throw new AppError('OTP not found or expired', 400, 'OTP_INVALID');
    }

    if (stored.expiresAt < new Date()) {
      otpStore.delete(emailOrPhone);
      throw new AppError('OTP expired', 400, 'OTP_EXPIRED');
    }

    if (stored.code !== otp) {
      throw new AppError('Invalid OTP', 400, 'OTP_INVALID');
    }

    stored.verified = true;
    return true;
  }

  // Reset password
  static async resetPassword(
    emailOrPhone: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    const stored = otpStore.get(emailOrPhone);
    const userRepo = this.getUserRepository();
    const refreshTokenRepo = this.getRefreshTokenRepository();

    if (!stored || !stored.verified) {
      throw new AppError('OTP not verified', 400, 'OTP_NOT_VERIFIED');
    }

    if (stored.expiresAt < new Date()) {
      otpStore.delete(emailOrPhone);
      throw new AppError('OTP expired', 400, 'OTP_EXPIRED');
    }

    const user = await userRepo.findOne({
      where: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    user.passwordHash = passwordHash;
    await userRepo.save(user);

    // Invalidate all refresh tokens
    await refreshTokenRepo.delete({ userId: user.id });

    // Remove OTP
    otpStore.delete(emailOrPhone);

    logger.info(`Password reset for user: ${user.id}`);
  }

  // Logout - invalidate refresh token
  static async logout(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenRepo = this.getRefreshTokenRepository();
    await refreshTokenRepo.delete({
      userId,
      token: refreshToken,
    });

    logger.info(`User logged out: ${userId}`);
  }

  // Get current user
  static async getCurrentUser(userId: string): Promise<Partial<User>> {
    const userRepo = this.getUserRepository();
    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
