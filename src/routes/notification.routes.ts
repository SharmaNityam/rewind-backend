import { Router } from 'express';
import { query } from 'express-validator';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { validateUUID } from '../middleware/uuidValidator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('per_page').optional().isInt({ min: 1, max: 100 }),
  ]),
  NotificationController.getNotifications
);

// Get unread count
router.get('/unread', NotificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', validateUUID('id'), NotificationController.markAsRead);

// Mark all as read
router.put('/read-all', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', validateUUID('id'), NotificationController.deleteNotification);

export default router;

