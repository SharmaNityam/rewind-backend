import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  // Register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;

      const result = await AuthService.register({
        name,
        email,
        phone,
        password,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, password } = req.body;

      const result = await AuthService.login({
        email,
        phone,
        password,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone } = req.body;
      const emailOrPhone = email || phone;

      if (!emailOrPhone) {
        throw new AppError('Email or phone is required', 400, 'VALIDATION_ERROR');
      }

      await AuthService.forgotPassword(emailOrPhone);

      res.status(200).json({
        success: true,
        message: 'If the account exists, an OTP has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP
  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, otp } = req.body;
      const emailOrPhone = email || phone;

      if (!emailOrPhone || !otp) {
        throw new AppError('Email/phone and OTP are required', 400, 'VALIDATION_ERROR');
      }

      await AuthService.verifyOTP(emailOrPhone, otp);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, otp, newPassword } = req.body;
      const emailOrPhone = email || phone;

      if (!emailOrPhone || !otp || !newPassword) {
        throw new AppError(
          'Email/phone, OTP, and new password are required',
          400,
          'VALIDATION_ERROR'
        );
      }

      await AuthService.resetPassword(emailOrPhone, otp, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const refreshToken = req.body.refreshToken;

      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      if (refreshToken) {
        await AuthService.logout(userId, refreshToken);
      } else {
        // Logout from all devices
        const { AppDataSource } = await import('../config/typeorm');
        const { RefreshToken } = await import('../entities');
        const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
        await refreshTokenRepo.delete({ userId });
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const user = await AuthService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

