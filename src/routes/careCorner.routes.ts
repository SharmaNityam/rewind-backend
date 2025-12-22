import { Router } from 'express';
import { body, query } from 'express-validator';
import { CareCornerController } from '../controllers/careCorner.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get daily challenges
router.get(
  '/challenges',
  validate([query('date').optional().isISO8601()]),
  CareCornerController.getChallenges
);

// Complete challenge
router.post('/challenges/:id/complete', CareCornerController.completeChallenge);

// Get breathing history
router.get(
  '/breathing',
  validate([query('limit').optional().isInt({ min: 1, max: 100 })]),
  CareCornerController.getBreathingHistory
);

// Record breathing exercise
router.post(
  '/breathing',
  validate([
    body('durationSeconds')
      .isInt({ min: 1 })
      .withMessage('Duration in seconds is required'),
  ]),
  CareCornerController.recordBreathing
);

// Get meditation history
router.get(
  '/meditation',
  validate([query('limit').optional().isInt({ min: 1, max: 100 })]),
  CareCornerController.getMeditationHistory
);

// Record meditation session
router.post(
  '/meditation',
  validate([
    body('durationSeconds')
      .isInt({ min: 1 })
      .withMessage('Duration in seconds is required'),
    body('soundName').trim().notEmpty().withMessage('Sound name is required'),
  ]),
  CareCornerController.recordMeditation
);

// Get all activities
router.get(
  '/activities',
  validate([query('limit').optional().isInt({ min: 1, max: 100 })]),
  CareCornerController.getAllActivities
);

// Get wellness stats
router.get('/stats', CareCornerController.getStats);

export default router;

