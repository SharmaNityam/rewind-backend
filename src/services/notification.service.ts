import { AppDataSource } from '../config/typeorm';
import { Notification } from '../entities';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

export interface CreateNotificationData {
  type: string;
  title: string;
  subtitle: string;
  iconName: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export class NotificationService {
  private static getNotificationRepository(): Repository<Notification> {
    return AppDataSource.getRepository(Notification);
  }

  // Create notification
  static async createNotification(
    userId: string,
    data: CreateNotificationData
  ) {
    const notificationRepo = this.getNotificationRepository();
    const notification = notificationRepo.create({
      userId,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle,
      iconName: data.iconName,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
    });

    const saved = await notificationRepo.save(notification);
    logger.info(`Notification created: ${saved.id} for user: ${userId}`);

    return saved;
  }

  // Get user notifications
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    perPage: number = 20
  ) {
    const notificationRepo = this.getNotificationRepository();
    const skip = (page - 1) * perPage;

    const [notifications, total] = await Promise.all([
      notificationRepo.find({
        where: { userId },
        skip,
        take: perPage,
        order: { createdAt: 'DESC' },
      }),
      notificationRepo.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNext: page * perPage < total,
        hasPrev: page > 1,
      },
    };
  }

  // Get unread count
  static async getUnreadCount(userId: string) {
    const notificationRepo = this.getNotificationRepository();
    const count = await notificationRepo.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string) {
    const notificationRepo = this.getNotificationRepository();
    const notification = await notificationRepo.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    notification.isRead = true;
    return await notificationRepo.save(notification);
  }

  // Mark all as read
  static async markAllAsRead(userId: string) {
    const notificationRepo = this.getNotificationRepository();
    await notificationRepo.update(
      { userId, isRead: false },
      { isRead: true }
    );
    logger.info(`All notifications marked as read for user: ${userId}`);
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string) {
    const notificationRepo = this.getNotificationRepository();
    const notification = await notificationRepo.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    await notificationRepo.remove(notification);
    logger.info(`Notification deleted: ${notificationId} for user: ${userId}`);
  }
}
