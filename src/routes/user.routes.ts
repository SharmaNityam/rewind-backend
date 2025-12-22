import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.put(
  '/profile',
  validate([
    body('name').optional().trim().notEmpty(),
    body('location').optional().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'prefer_not_to_say']),
    body('age').optional().isInt({ min: 14, max: 99 }),
    body('healthGoal').optional().trim(),
    body('seekingProfessionalHelp').optional().isBoolean(),
  ]),
  UserController.updateProfile
);

// Upload profile image
router.post(
  '/profile/avatar',
  uploadSingle('avatar'),
  UserController.updateProfileImage
);

// Save onboarding data
router.post(
  '/onboarding',
  validate([
    body('healthGoal').trim().notEmpty().withMessage('Health goal is required'),
    body('gender')
      .isIn(['male', 'female', 'prefer_not_to_say'])
      .withMessage('Valid gender is required'),
    body('age')
      .isInt({ min: 14, max: 99 })
      .withMessage('Age must be between 14 and 99'),
    body('seekingProfessionalHelp')
      .isBoolean()
      .withMessage('Seeking professional help must be a boolean'),
  ]),
  UserController.saveOnboarding
);

// Get onboarding status
router.get('/onboarding-status', UserController.getOnboardingStatus);

export default router;

