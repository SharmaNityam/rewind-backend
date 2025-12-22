import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Register
router.post(
  '/register',
  authRateLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  AuthController.register
);

// Login
router.post(
  '/login',
  authRateLimiter,
  validate([
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  AuthController.login
);

// Forgot password
router.post(
  '/forgot-password',
  authRateLimiter,
  validate([
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
  ]),
  AuthController.forgotPassword
);

// Verify OTP
router.post(
  '/verify-otp',
  authRateLimiter,
  validate([
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('otp').isLength({ min: 4, max: 8 }).withMessage('OTP is required'),
  ]),
  AuthController.verifyOTP
);

// Reset password
router.post(
  '/reset-password',
  authRateLimiter,
  validate([
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  AuthController.resetPassword
);

// Logout
router.post('/logout', authenticate, AuthController.logout);

// Get current user
router.get('/me', authenticate, AuthController.getMe);

export default router;

