import { Router } from 'express';
import { body, query } from 'express-validator';
import { GoalController } from '../controllers/goal.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List goals
router.get(
  '/',
  validate([
    query('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']),
  ]),
  GoalController.listGoals
);

// Get goal by ID
router.get('/:id', GoalController.getGoal);

// Create goal
router.post(
  '/',
  validate([
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('targetDate').optional().isISO8601(),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'paused', 'cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
  ]),
  GoalController.createGoal
);

// Update goal
router.put(
  '/:id',
  validate([
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('targetDate').optional().isISO8601(),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'paused', 'cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
  ]),
  GoalController.updateGoal
);

// Delete goal
router.delete('/:id', GoalController.deleteGoal);

// Update goal progress
router.put(
  '/:id/progress',
  validate([
    body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  ]),
  GoalController.updateProgress
);

export default router;

